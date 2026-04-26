import argparse
import math
import subprocess
import sys
from datetime import datetime


LEARNING_RATE = 0.03
REGULARIZATION = 0.001
FEATURE_COUNT = 10
MINIMUM_TRAINING_ROWS = 1000


def mysql_query(mysql_exe, host, port, user, database, query, skip_column_names=False):
    args = [
        mysql_exe,
        "--protocol=tcp",
        f"--host={host}",
        f"--port={port}",
        f"--user={user}",
        database,
        "--batch",
        "--raw",
    ]
    if skip_column_names:
        args.append("--skip-column-names")
    args.extend(["-e", query])

    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "mysql query failed")
    return [line for line in result.stdout.splitlines() if line.strip()]


def mysql_exec(mysql_exe, host, port, user, database, sql):
    args = [
        mysql_exe,
        "--protocol=tcp",
        f"--host={host}",
        f"--port={port}",
        f"--user={user}",
        database,
    ]
    result = subprocess.run(
        args,
        input=sql,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "mysql execution failed")
    return result.stdout


def round_model(value):
    return round(value + 1e-12, 2)


def sql_string(value):
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def feature_vector(sample):
    return [
        1.0 if sample["weather"] == "RAIN" else 0.0,
        1.0 if sample["weather"] == "SANDSTORM" else 0.0,
        1.0 if sample["weather"] == "STORM" else 0.0,
        1.0 if sample["traffic_jam"] else 0.0,
        1.0 if (7 <= sample["departure_hour"] <= 9) or (16 <= sample["departure_hour"] <= 19) else 0.0,
        1.0 if sample["departure_day_of_week"] in {"MONDAY", "FRIDAY"} else 0.0,
        1.0 if sample["distance_km"] >= 120.0 else 0.0,
        1.0 if sample["occupancy_rate"] >= 85.0 else 0.0,
        1.0 if sample["weather_wind_speed"] >= 60.0 else 0.0,
        1.0 if sample["weather_precipitation"] >= 10.0 else 0.0,
    ]


def dot(weights, features):
    return sum(w * f for w, f in zip(weights, features))


def build_notes(mae):
    if mae <= 5:
        return "Model trained on real host transport history. Current performance looks strong."
    if mae <= 12:
        return "Model trained on real host transport history. More diverse completed trips can still improve forecasts."
    return "Model is active on real host transport history, but prediction error is still high. Collect more completed trips with actual delay values to improve it."


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host-id", type=int, required=True)
    parser.add_argument("--mysql-exe", default=r"C:\xampp\mysql\bin\mysql.exe")
    parser.add_argument("--mysql-host", default="127.0.0.1")
    parser.add_argument("--mysql-port", type=int, default=3306)
    parser.add_argument("--mysql-user", default="root")
    parser.add_argument("--database", default="baladna")
    args = parser.parse_args()

    host_rows = mysql_query(
        args.mysql_exe,
        args.mysql_host,
        args.mysql_port,
        args.mysql_user,
        args.database,
        f"SELECT email, UPPER(TRIM(role)) FROM user WHERE id = {args.host_id};",
        skip_column_names=True,
    )
    if not host_rows:
        raise RuntimeError(f"Host id {args.host_id} does not exist.")

    host_parts = host_rows[0].split("\t")
    if len(host_parts) < 2 or host_parts[1].strip() != "HOST":
        raise RuntimeError(f"User id {args.host_id} is not a HOST.")
    host_email = host_parts[0].strip()

    sample_rows = mysql_query(
        args.mysql_exe,
        args.mysql_host,
        args.mysql_port,
        args.mysql_user,
        args.database,
        f"""
SELECT
  IFNULL(weather, ''),
  IFNULL(CAST(traffic_jam AS UNSIGNED), 0),
  IFNULL(departure_hour, 0),
  IFNULL(departure_day_of_week, ''),
  IFNULL(distance_km, 0),
  IFNULL(occupancy_rate, 0),
  IFNULL(weather_wind_speed, 0),
  IFNULL(weather_precipitation, 0),
  actual_delay_minutes
FROM transport_ai_trip_dataset
WHERE host_id = {args.host_id}
  AND actual_delay_minutes IS NOT NULL
ORDER BY departure_date DESC;
""",
        skip_column_names=True,
    )

    samples = []
    for row in sample_rows:
        parts = row.split("\t")
        if len(parts) < 9:
            continue
        samples.append(
            {
                "weather": parts[0].strip().upper(),
                "traffic_jam": parts[1].strip() == "1",
                "departure_hour": int(parts[2] or "0"),
                "departure_day_of_week": parts[3].strip().upper(),
                "distance_km": float(parts[4] or "0"),
                "occupancy_rate": float(parts[5] or "0"),
                "weather_wind_speed": float(parts[6] or "0"),
                "weather_precipitation": float(parts[7] or "0"),
                "actual_delay_minutes": float(parts[8] or "0"),
            }
        )

    if len(samples) < MINIMUM_TRAINING_ROWS:
        raise RuntimeError(
            f"At least {MINIMUM_TRAINING_ROWS} dataset rows are required before training the AI model. Found: {len(samples)}."
        )

    intercept = sum(sample["actual_delay_minutes"] for sample in samples) / len(samples)
    weights = [0.0] * FEATURE_COUNT
    iterations = max(800, min(5000, len(samples) * 140))

    for _ in range(iterations):
        gradient_intercept = 0.0
        gradient_weights = [0.0] * FEATURE_COUNT

        for sample in samples:
            features = feature_vector(sample)
            target = sample["actual_delay_minutes"]
            prediction = intercept + dot(weights, features)
            prediction_error = prediction - target

            gradient_intercept += prediction_error
            for index in range(FEATURE_COUNT):
                gradient_weights[index] += prediction_error * features[index]

        sample_count = float(len(samples))
        intercept -= LEARNING_RATE * (gradient_intercept / sample_count)
        for index in range(FEATURE_COUNT):
            gradient = (gradient_weights[index] / sample_count) + (REGULARIZATION * weights[index])
            weights[index] -= LEARNING_RATE * gradient

    mae = 0.0
    mse = 0.0
    for sample in samples:
        prediction = intercept + dot(weights, feature_vector(sample))
        prediction_error = prediction - sample["actual_delay_minutes"]
        mae += abs(prediction_error)
        mse += prediction_error * prediction_error

    mae /= len(samples)
    mse /= len(samples)
    rmse = math.sqrt(mse)
    notes = build_notes(mae)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

    sql = f"""
UPDATE transport_ai_delay_models
SET active = b'0', updated_at = '{timestamp}'
WHERE host_id = {args.host_id} AND active = b'1';

INSERT INTO transport_ai_delay_models (
  active,
  created_at,
  heavy_precipitation_weight,
  high_occupancy_weight,
  intercept_weight,
  long_route_weight,
  mean_absolute_error,
  notes,
  peak_weekday_weight,
  rain_weight,
  root_mean_squared_error,
  rush_hour_weight,
  sample_count,
  sandstorm_weight,
  storm_weight,
  strong_wind_weight,
  traffic_jam_weight,
  trained_at,
  updated_at,
  host_id
) VALUES (
  b'1',
  '{timestamp}',
  {round_model(weights[9])},
  {round_model(weights[7])},
  {round_model(intercept)},
  {round_model(weights[6])},
  {round_model(mae)},
  {sql_string(notes)},
  {round_model(weights[5])},
  {round_model(weights[0])},
  {round_model(rmse)},
  {round_model(weights[4])},
  {len(samples)},
  {round_model(weights[1])},
  {round_model(weights[2])},
  {round_model(weights[8])},
  {round_model(weights[3])},
  '{timestamp}',
  '{timestamp}',
  {args.host_id}
);

SELECT id, host_id, sample_count, active, mean_absolute_error, root_mean_squared_error, trained_at
FROM transport_ai_delay_models
WHERE host_id = {args.host_id}
ORDER BY id DESC
LIMIT 1;
"""

    output = mysql_exec(
        args.mysql_exe,
        args.mysql_host,
        args.mysql_port,
        args.mysql_user,
        args.database,
        sql,
    )

    print("Transport AI delay model trained successfully.")
    print(f"Host               : {host_email} ({args.host_id})")
    print(f"Sample count       : {len(samples)}")
    print(f"Intercept          : {round_model(intercept)}")
    print(f"Mean abs. error    : {round_model(mae)}")
    print(f"RMSE               : {round_model(rmse)}")
    print(f"Notes              : {notes}")
    if output.strip():
        print(output.strip())


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
