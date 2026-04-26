const { execFileSync } = require("child_process");

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1];
}

function requireArg(name) {
  const value = getArg(name);
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function mysqlQuery(mysqlExe, host, port, user, database, query, skipColumnNames = false) {
  const mysqlArgs = [
    "--protocol=tcp",
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    database,
    "--batch",
    "--raw",
  ];

  if (skipColumnNames) {
    mysqlArgs.push("--skip-column-names");
  }

  mysqlArgs.push("-e", query);
  return execFileSync(mysqlExe, mysqlArgs, { encoding: "utf8" })
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
}

function mysqlExec(mysqlExe, host, port, user, database, sql) {
  const mysqlArgs = [
    "--protocol=tcp",
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    database,
  ];

  return execFileSync(mysqlExe, mysqlArgs, {
    input: sql,
    encoding: "utf8",
  });
}

function roundModel(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sqlString(value) {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function featureVector(sample) {
  return [
    sample.weather === "RAIN" ? 1 : 0,
    sample.weather === "SANDSTORM" ? 1 : 0,
    sample.weather === "STORM" ? 1 : 0,
    sample.trafficJam ? 1 : 0,
    (sample.departureHour >= 7 && sample.departureHour <= 9) ||
    (sample.departureHour >= 16 && sample.departureHour <= 19)
      ? 1
      : 0,
    sample.departureDayOfWeek === "MONDAY" || sample.departureDayOfWeek === "FRIDAY" ? 1 : 0,
    sample.distanceKm >= 120 ? 1 : 0,
    sample.occupancyRate >= 85 ? 1 : 0,
    sample.weatherWindSpeed >= 60 ? 1 : 0,
    sample.weatherPrecipitation >= 10 ? 1 : 0,
  ];
}

function dot(weights, features) {
  let total = 0;
  for (let index = 0; index < weights.length; index += 1) {
    total += weights[index] * features[index];
  }
  return total;
}

function buildNotes(mae, usedOnlyRealHistory, realSampleCount, bootstrapSampleCount, sampleCount) {
  const datasetSourceNote = usedOnlyRealHistory
    ? `Model trained on fully real host transport history (${realSampleCount} rows). `
    : `Model trained on a mixed host dataset (${realSampleCount} real rows, ${bootstrapSampleCount} bootstrap-import rows, ${sampleCount} rows used). `;

  if (mae <= 5) {
    return `${datasetSourceNote}Current performance looks strong.`;
  }
  if (mae <= 12) {
    return `${datasetSourceNote}More diverse completed trips can still improve forecasts.`;
  }
  return `${datasetSourceNote}Prediction error is still high. Collect more completed trips with actual delay values to improve it.`;
}

function formatTimestamp(date) {
  const pad = (value, size = 2) => String(value).padStart(size, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds() * 1000, 6)}`;
}

function main() {
  const hostId = Number(requireArg("--host-id"));
  const mysqlExe = getArg("--mysql-exe", "C:\\xampp\\mysql\\bin\\mysql.exe");
  const mysqlHost = getArg("--mysql-host", "127.0.0.1");
  const mysqlPort = Number(getArg("--mysql-port", "3306"));
  const mysqlUser = getArg("--mysql-user", "root");
  const database = getArg("--database", "baladna");

  const hostRows = mysqlQuery(
    mysqlExe,
    mysqlHost,
    mysqlPort,
    mysqlUser,
    database,
    `SELECT email, UPPER(TRIM(role)) FROM user WHERE id = ${hostId};`,
    true
  );

  if (hostRows.length === 0) {
    throw new Error(`Host id ${hostId} does not exist.`);
  }

  const [hostEmail, hostRole] = hostRows[0].split("\t");
  if ((hostRole || "").trim() !== "HOST") {
    throw new Error(`User id ${hostId} is not a HOST.`);
  }

  const sampleRows = mysqlQuery(
    mysqlExe,
    mysqlHost,
    mysqlPort,
    mysqlUser,
    database,
    `
SELECT
  IFNULL(data_origin, 'REAL'),
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
WHERE host_id = ${hostId}
  AND actual_delay_minutes IS NOT NULL
ORDER BY departure_date DESC;
`,
    true
  );

  const samples = sampleRows
    .map((row) => row.split("\t"))
    .filter((parts) => parts.length >= 10)
    .map((parts) => ({
      dataOrigin: (parts[0] || "REAL").trim().toUpperCase(),
      weather: (parts[1] || "").trim().toUpperCase(),
      trafficJam: (parts[2] || "").trim() === "1",
      departureHour: Number(parts[3] || "0"),
      departureDayOfWeek: (parts[4] || "").trim().toUpperCase(),
      distanceKm: Number(parts[5] || "0"),
      occupancyRate: Number(parts[6] || "0"),
      weatherWindSpeed: Number(parts[7] || "0"),
      weatherPrecipitation: Number(parts[8] || "0"),
      actualDelayMinutes: Number(parts[9] || "0"),
    }));

  const realSamples = samples.filter((sample) => sample.dataOrigin === "REAL");
  const bootstrapSamples = samples.filter((sample) => sample.dataOrigin === "BOOTSTRAP_IMPORT");
  const useRealOnlySamples = realSamples.length >= 1000;
  const trainingSamples = useRealOnlySamples ? realSamples : samples;

  if (trainingSamples.length < 1000) {
    throw new Error(`At least 1000 dataset rows are required before training the AI model. Currently available: ${samples.length} eligible rows (${realSamples.length} real, ${bootstrapSamples.length} bootstrap-import).`);
  }

  const learningRate = 0.03;
  const regularization = 0.001;
  const featureCount = 10;
  const iterations = Math.max(800, Math.min(5000, trainingSamples.length * 140));

  let intercept = trainingSamples.reduce((sum, sample) => sum + sample.actualDelayMinutes, 0) / trainingSamples.length;
  const weights = new Array(featureCount).fill(0);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let gradientIntercept = 0;
    const gradientWeights = new Array(featureCount).fill(0);

    for (const sample of trainingSamples) {
      const features = featureVector(sample);
      const target = sample.actualDelayMinutes;
      const prediction = intercept + dot(weights, features);
      const predictionError = prediction - target;

      gradientIntercept += predictionError;
      for (let index = 0; index < featureCount; index += 1) {
        gradientWeights[index] += predictionError * features[index];
      }
    }

    const sampleCount = trainingSamples.length;
    intercept -= learningRate * (gradientIntercept / sampleCount);
    for (let index = 0; index < featureCount; index += 1) {
      const gradient = gradientWeights[index] / sampleCount + regularization * weights[index];
      weights[index] -= learningRate * gradient;
    }
  }

  let mae = 0;
  let mse = 0;
  for (const sample of trainingSamples) {
    const prediction = intercept + dot(weights, featureVector(sample));
    const predictionError = prediction - sample.actualDelayMinutes;
    mae += Math.abs(predictionError);
    mse += predictionError * predictionError;
  }
  mae /= trainingSamples.length;
  mse /= trainingSamples.length;
  const rmse = Math.sqrt(mse);
  const notes = buildNotes(mae, useRealOnlySamples, realSamples.length, bootstrapSamples.length, trainingSamples.length);
  const timestamp = formatTimestamp(new Date());

  const sql = `
UPDATE transport_ai_delay_models
SET active = b'0', updated_at = '${timestamp}'
WHERE host_id = ${hostId} AND active = b'1';

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
  '${timestamp}',
  ${roundModel(weights[9])},
  ${roundModel(weights[7])},
  ${roundModel(intercept)},
  ${roundModel(weights[6])},
  ${roundModel(mae)},
  ${sqlString(notes)},
  ${roundModel(weights[5])},
  ${roundModel(weights[0])},
  ${roundModel(rmse)},
  ${roundModel(weights[4])},
  ${trainingSamples.length},
  ${roundModel(weights[1])},
  ${roundModel(weights[2])},
  ${roundModel(weights[8])},
  ${roundModel(weights[3])},
  '${timestamp}',
  '${timestamp}',
  ${hostId}
);

SELECT id, host_id, sample_count, active, mean_absolute_error, root_mean_squared_error, trained_at
FROM transport_ai_delay_models
WHERE host_id = ${hostId}
ORDER BY id DESC
LIMIT 1;
`;

  const output = mysqlExec(mysqlExe, mysqlHost, mysqlPort, mysqlUser, database, sql);

  console.log("Transport AI delay model trained successfully.");
  console.log(`Host               : ${hostEmail.trim()} (${hostId})`);
  console.log(`Sample count       : ${trainingSamples.length}`);
  console.log(`Real rows ready    : ${realSamples.length}`);
  console.log(`Bootstrap rows     : ${bootstrapSamples.length}`);
  console.log(`Training source    : ${useRealOnlySamples ? "REAL_ONLY" : "MIXED_WITH_BOOTSTRAP"}`);
  console.log(`Intercept          : ${roundModel(intercept)}`);
  console.log(`Mean abs. error    : ${roundModel(mae)}`);
  console.log(`RMSE               : ${roundModel(rmse)}`);
  console.log(`Notes              : ${notes}`);
  if (output.trim()) {
    console.log(output.trim());
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
