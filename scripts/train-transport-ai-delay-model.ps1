param(
    [Parameter(Mandatory = $true)]
    [int]$HostId,
    [string]$MysqlExe = "C:\xampp\mysql\bin\mysql.exe",
    [string]$MysqlHost = "127.0.0.1",
    [int]$MysqlPort = 3306,
    [string]$MysqlUser = "root",
    [string]$Database = "baladna"
)

$ErrorActionPreference = "Stop"

function Invoke-MysqlQuery {
    param(
        [string]$Query,
        [switch]$SkipColumnNames
    )

    $arguments = @(
        "--protocol=tcp",
        "--host=$MysqlHost",
        "--port=$MysqlPort",
        "--user=$MysqlUser",
        $Database,
        "--batch",
        "--raw"
    )

    if ($SkipColumnNames) {
        $arguments += "--skip-column-names"
    }

    $arguments += @("-e", $Query)

    $output = & $MysqlExe @arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output -join [Environment]::NewLine)
    }

    return @($output)
}

function Round-ModelDouble {
    param([double]$Value)

    return [math]::Round($Value, 2)
}

function Get-FeatureVector {
    param($Sample)

    $features = New-Object double[] 10
    $features[0] = if ($Sample.Weather -eq "RAIN") { 1.0 } else { 0.0 }
    $features[1] = if ($Sample.Weather -eq "SANDSTORM") { 1.0 } else { 0.0 }
    $features[2] = if ($Sample.Weather -eq "STORM") { 1.0 } else { 0.0 }
    $features[3] = if ($Sample.TrafficJam) { 1.0 } else { 0.0 }
    $features[4] = if (($Sample.DepartureHour -ge 7 -and $Sample.DepartureHour -le 9) -or ($Sample.DepartureHour -ge 16 -and $Sample.DepartureHour -le 19)) { 1.0 } else { 0.0 }
    $features[5] = if ($Sample.DepartureDayOfWeek -in @("MONDAY", "FRIDAY")) { 1.0 } else { 0.0 }
    $features[6] = if ($Sample.DistanceKm -ge 120.0) { 1.0 } else { 0.0 }
    $features[7] = if ($Sample.OccupancyRate -ge 85.0) { 1.0 } else { 0.0 }
    $features[8] = if ($Sample.WeatherWindSpeed -ge 60.0) { 1.0 } else { 0.0 }
    $features[9] = if ($Sample.WeatherPrecipitation -ge 10.0) { 1.0 } else { 0.0 }
    return ,$features
}

function Get-DotProduct {
    param(
        [double[]]$Weights,
        [double[]]$Features
    )

    $value = 0.0
    for ($index = 0; $index -lt $Weights.Length; $index++) {
        $value += $Weights[$index] * $Features[$index]
    }

    return $value
}

function Get-TrainingNotes {
    param(
        [int]$SampleCount,
        [double]$MeanAbsoluteError
    )

    if ($MeanAbsoluteError -le 5.0) {
        return "Model trained on real host transport history. Current performance looks strong."
    }

    if ($MeanAbsoluteError -le 12.0) {
        return "Model trained on real host transport history. More diverse completed trips can still improve forecasts."
    }

    return "Model is active on real host transport history, but prediction error is still high. Collect more completed trips with actual delay values to improve it."
}

if (-not (Test-Path -LiteralPath $MysqlExe)) {
    throw "mysql.exe not found: $MysqlExe"
}

$hostEmailRows = Invoke-MysqlQuery -Query "SELECT email FROM user WHERE id = $HostId;" -SkipColumnNames
$hostRoleRows = Invoke-MysqlQuery -Query "SELECT UPPER(TRIM(role)) FROM user WHERE id = $HostId;" -SkipColumnNames

$hostEmail = ($hostEmailRows | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | Select-Object -First 1)
$hostRole = ($hostRoleRows | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | Select-Object -First 1)

if ([string]::IsNullOrWhiteSpace([string]$hostEmail)) {
    throw "Host id $HostId does not exist."
}

if ((([string]$hostRole).Trim()) -ne "HOST") {
    throw "User id $HostId is not a HOST."
}

$sampleRows = Invoke-MysqlQuery -Query @"
SELECT CONCAT(
  IFNULL(weather, ''), '|',
  IFNULL(CAST(traffic_jam AS UNSIGNED), 0), '|',
  IFNULL(departure_hour, 0), '|',
  IFNULL(departure_day_of_week, ''), '|',
  IFNULL(distance_km, 0), '|',
  IFNULL(occupancy_rate, 0), '|',
  IFNULL(weather_wind_speed, 0), '|',
  IFNULL(weather_precipitation, 0), '|',
  actual_delay_minutes
)
FROM transport_ai_trip_dataset
WHERE host_id = $HostId
  AND actual_delay_minutes IS NOT NULL
ORDER BY departure_date DESC;
"@ -SkipColumnNames

$samples = New-Object System.Collections.Generic.List[object]
foreach ($sampleRow in @($sampleRows)) {
    if ([string]::IsNullOrWhiteSpace($sampleRow)) {
        continue
    }

    $parts = ([string]$sampleRow).Trim() -split '\|'
    if ($parts.Count -lt 9) {
        continue
    }

    $samples.Add([pscustomobject]@{
        Weather               = $parts[0].Trim().ToUpperInvariant()
        TrafficJam            = $parts[1].Trim() -eq "1"
        DepartureHour         = [int]$parts[2]
        DepartureDayOfWeek    = $parts[3].Trim().ToUpperInvariant()
        DistanceKm            = [double]::Parse($parts[4], [System.Globalization.CultureInfo]::InvariantCulture)
        OccupancyRate         = [double]::Parse($parts[5], [System.Globalization.CultureInfo]::InvariantCulture)
        WeatherWindSpeed      = [double]::Parse($parts[6], [System.Globalization.CultureInfo]::InvariantCulture)
        WeatherPrecipitation  = [double]::Parse($parts[7], [System.Globalization.CultureInfo]::InvariantCulture)
        ActualDelayMinutes    = [double]::Parse($parts[8], [System.Globalization.CultureInfo]::InvariantCulture)
    }) | Out-Null
}

if ($samples.Count -lt 1000) {
    throw "At least 1000 dataset rows are required before training the AI model. Found: $($samples.Count)."
}

$learningRate = 0.03
$regularization = 0.001
$featureCount = 10

$intercept = ($samples | Measure-Object -Property ActualDelayMinutes -Average).Average
$weights = New-Object double[] $featureCount
$iterations = [Math]::Max(800, [Math]::Min(5000, $samples.Count * 140))

for ($iteration = 0; $iteration -lt $iterations; $iteration++) {
    $gradientIntercept = 0.0
    $gradientWeights = New-Object double[] $featureCount

    foreach ($sample in $samples) {
        $features = Get-FeatureVector -Sample $sample
        $target = $sample.ActualDelayMinutes
        $prediction = $intercept + (Get-DotProduct -Weights $weights -Features $features)
        $predictionError = $prediction - $target

        $gradientIntercept += $predictionError
        for ($index = 0; $index -lt $featureCount; $index++) {
            $gradientWeights[$index] += $predictionError * $features[$index]
        }
    }

    $sampleCount = [double]$samples.Count
    $intercept -= $learningRate * ($gradientIntercept / $sampleCount)
    for ($index = 0; $index -lt $featureCount; $index++) {
        $gradient = ($gradientWeights[$index] / $sampleCount) + ($regularization * $weights[$index])
        $weights[$index] -= $learningRate * $gradient
    }
}

$mae = 0.0
$mse = 0.0
foreach ($sample in $samples) {
    $prediction = $intercept + (Get-DotProduct -Weights $weights -Features (Get-FeatureVector -Sample $sample))
    $predictionError = $prediction - $sample.ActualDelayMinutes
    $mae += [Math]::Abs($predictionError)
    $mse += ($predictionError * $predictionError)
}

$mae /= $samples.Count
$mse /= $samples.Count
$rmse = [Math]::Sqrt($mse)
$notes = Get-TrainingNotes -SampleCount $samples.Count -MeanAbsoluteError $mae
$timestamp = Get-Date
$formattedTimestamp = $timestamp.ToString("yyyy-MM-dd HH:mm:ss.ffffff", [System.Globalization.CultureInfo]::InvariantCulture)

$insertQuery = @"
UPDATE transport_ai_delay_models
SET active = b'0', updated_at = '$formattedTimestamp'
WHERE host_id = $HostId AND active = b'1';

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
  '$formattedTimestamp',
  $(Round-ModelDouble $weights[9]),
  $(Round-ModelDouble $weights[7]),
  $(Round-ModelDouble $intercept),
  $(Round-ModelDouble $weights[6]),
  $(Round-ModelDouble $mae),
  '$(($notes -replace "'", "''"))',
  $(Round-ModelDouble $weights[5]),
  $(Round-ModelDouble $weights[0]),
  $(Round-ModelDouble $rmse),
  $(Round-ModelDouble $weights[4]),
  $($samples.Count),
  $(Round-ModelDouble $weights[1]),
  $(Round-ModelDouble $weights[2]),
  $(Round-ModelDouble $weights[8]),
  $(Round-ModelDouble $weights[3]),
  '$formattedTimestamp',
  '$formattedTimestamp',
  $HostId
);

SELECT id, host_id, sample_count, active, mean_absolute_error, root_mean_squared_error, trained_at
FROM transport_ai_delay_models
WHERE host_id = $HostId
ORDER BY id DESC
LIMIT 1;
"@

$tempSqlPath = Join-Path ([System.IO.Path]::GetTempPath()) "transport_ai_delay_model_train_$HostId.sql"
[System.IO.File]::WriteAllText($tempSqlPath, $insertQuery, [System.Text.UTF8Encoding]::new($false))

$result = Get-Content -LiteralPath $tempSqlPath -Raw | & $MysqlExe --protocol=tcp --host=$MysqlHost --port=$MysqlPort --user=$MysqlUser $Database 2>&1
if ($LASTEXITCODE -ne 0) {
    throw ($result -join [Environment]::NewLine)
}

Write-Host "Transport AI delay model trained successfully." -ForegroundColor Green
Write-Host ("Host               : {0} ({1})" -f ([string]$hostEmail).Trim(), $HostId)
Write-Host ("Sample count       : {0}" -f $samples.Count)
Write-Host ("Intercept          : {0}" -f (Round-ModelDouble $intercept))
Write-Host ("Mean abs. error    : {0}" -f (Round-ModelDouble $mae))
Write-Host ("RMSE               : {0}" -f (Round-ModelDouble $rmse))
Write-Host ("Notes              : {0}" -f $notes)
