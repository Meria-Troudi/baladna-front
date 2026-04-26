param(
    [string]$CsvPath = "C:\Users\kacem\Downloads\baladna-frontend-develop\baladna-frontend-develop\scripts\generated\transport_dataset_v3.real-trajets.csv",
    [Parameter(Mandatory = $true)]
    [int]$HostId,
    [string]$MysqlExe = "C:\xampp\mysql\bin\mysql.exe",
    [string]$MysqlHost = "127.0.0.1",
    [int]$MysqlPort = 3306,
    [string]$MysqlUser = "root",
    [string]$Database = "baladna"
)

$ErrorActionPreference = 'Stop'

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

function Escape-SqlString {
    param([string]$Value)

    if ($null -eq $Value) {
        return "NULL"
    }

    return "'" + $Value.Replace("\", "\\").Replace("'", "''") + "'"
}

function To-SqlDouble {
    param($Value)

    if ([string]::IsNullOrWhiteSpace([string]$Value)) {
        return "NULL"
    }

    return ([double]::Parse([string]$Value, [System.Globalization.CultureInfo]::InvariantCulture)).ToString([System.Globalization.CultureInfo]::InvariantCulture)
}

function To-SqlInt {
    param($Value)

    if ([string]::IsNullOrWhiteSpace([string]$Value)) {
        return "NULL"
    }

    return [int]$Value
}

function Get-RuleBasedDelayMinutes {
    param(
        [string]$Weather,
        [bool]$TrafficJam
    )

    $delay = 0

    switch ($Weather) {
        'RAIN' { $delay += 25 }
        'SANDSTORM' { $delay += 30 }
        'STORM' { $delay += 40 }
        default { }
    }

    if ($TrafficJam) {
        $delay += 20
    }

    return $delay
}

if (-not (Test-Path -LiteralPath $CsvPath)) {
    throw "CSV file not found: $CsvPath"
}

if (-not (Test-Path -LiteralPath $MysqlExe)) {
    throw "mysql.exe not found: $MysqlExe"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ensureDataOriginScriptPath = Join-Path $scriptRoot "ensure-transport-ai-data-origin.ps1"
if (Test-Path -LiteralPath $ensureDataOriginScriptPath) {
    & powershell -ExecutionPolicy Bypass -File $ensureDataOriginScriptPath -MysqlExe $MysqlExe -MysqlHost $MysqlHost -MysqlPort $MysqlPort -MysqlUser $MysqlUser -Database $Database
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to prepare the data_origin column before dataset import."
    }
}

$hostEmailRows = Invoke-MysqlQuery -Query "SELECT email FROM user WHERE id = $HostId;" -SkipColumnNames
$hostRoleRows = Invoke-MysqlQuery -Query "SELECT UPPER(TRIM(role)) FROM user WHERE id = $HostId;" -SkipColumnNames

$hostEmail = ($hostEmailRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1)
$hostRole = ($hostRoleRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1)

if ([string]::IsNullOrWhiteSpace($hostEmail)) {
    throw "Host id $HostId does not exist in table user."
}

$normalizedHostRole = if ($null -eq $hostRole) { '' } else { $hostRole.Trim() }
if ($normalizedHostRole -ne 'HOST') {
    throw "User id $HostId exists but is not a HOST."
}

$trajetRows = Invoke-MysqlQuery -Query @"
SELECT
  CONCAT(
    t.id, '|',
    IFNULL(t.departure_station_id, ''), '|',
    IFNULL(t.arrival_station_id, ''), '|',
    IFNULL(ds.city, ''), '|',
    IFNULL(arr.city, ''), '|',
    IFNULL(t.distance_km, 0), '|',
    IFNULL(t.estimated_duration_minutes, 0)
  )
FROM trajets t
LEFT JOIN stations ds ON ds.id = t.departure_station_id
LEFT JOIN stations arr ON arr.id = t.arrival_station_id
ORDER BY t.id;
"@ -SkipColumnNames

$trajetLookup = @{}
foreach ($trajetRow in $trajetRows) {
    if ([string]::IsNullOrWhiteSpace($trajetRow)) {
        continue
    }

    $parts = $trajetRow -split '\|'
    $trajetLookup[[int]$parts[0]] = [pscustomobject]@{
        DepartureStationId       = if ($parts[1]) { [int]$parts[1] } else { $null }
        ArrivalStationId         = if ($parts[2]) { [int]$parts[2] } else { $null }
        DepartureCity            = $parts[3]
        ArrivalCity              = $parts[4]
        DistanceKm               = [double]::Parse($parts[5], [System.Globalization.CultureInfo]::InvariantCulture)
        EstimatedDurationMinutes = [int]$parts[6]
    }
}

$rows = @(Import-Csv -LiteralPath $CsvPath)
if ($rows.Count -eq 0) {
    throw "CSV is empty: $CsvPath"
}

$maxTransportIdRows = Invoke-MysqlQuery -Query "SELECT COALESCE(MAX(transport_id), 0) FROM transport_ai_trip_dataset;" -SkipColumnNames
$maxTransportId = [long]$maxTransportIdRows[0]
$nextTransportId = [Math]::Max($maxTransportId + 1, 1000000)

$timestamp = Get-Date
$createdAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss.ffffff", [System.Globalization.CultureInfo]::InvariantCulture)

$valueLines = New-Object System.Collections.Generic.List[string]

for ($index = 0; $index -lt $rows.Count; $index++) {
    $row = $rows[$index]
    $trajetId = [int]$row.trajetId

    if (-not $trajetLookup.ContainsKey($trajetId)) {
        throw "trajetId $trajetId from CSV does not exist in database."
    }

    $trajet = $trajetLookup[$trajetId]
    $departureDate = [datetime]::ParseExact($row.departureDate, "yyyy-MM-ddTHH:mm:ss", [System.Globalization.CultureInfo]::InvariantCulture)
    $actualDelayMinutes = [int]$row.actualDelayMinutes
    $actualDepartureDate = $departureDate.AddMinutes($actualDelayMinutes)
    $actualArrivalDate = $actualDepartureDate.AddMinutes($trajet.EstimatedDurationMinutes)
    $totalCapacity = [int]$row.totalCapacity
    $availableSeats = [int]$row.availableSeats
    $bookedSeats = [Math]::Max(0, $totalCapacity - $availableSeats)
    $occupancyRate = if ($totalCapacity -gt 0) {
        [Math]::Round(($bookedSeats / [double]$totalCapacity) * 100.0, 2)
    } else {
        0.0
    }
    $trafficJam = ([string]$row.trafficJam).Trim().ToLowerInvariant() -eq 'true'
    $ruleBasedDelayMinutes = Get-RuleBasedDelayMinutes -Weather $row.weather -TrafficJam $trafficJam
    $dayOfWeek = $departureDate.DayOfWeek.ToString().ToUpperInvariant()
    $isWeekend = if ($departureDate.DayOfWeek -in @([System.DayOfWeek]::Saturday, [System.DayOfWeek]::Sunday)) { 1 } else { 0 }
    $transportId = $nextTransportId + $index

    $valueLines.Add(@"
(
  NULL,
  $(Escape-SqlString $actualArrivalDate.ToString("yyyy-MM-dd HH:mm:ss.ffffff", [System.Globalization.CultureInfo]::InvariantCulture)),
  $actualDelayMinutes,
  $(Escape-SqlString $actualDepartureDate.ToString("yyyy-MM-dd HH:mm:ss.ffffff", [System.Globalization.CultureInfo]::InvariantCulture)),
  $(Escape-SqlString $trajet.ArrivalCity),
  $availableSeats,
  $(To-SqlDouble $row.basePrice),
  $bookedSeats,
  $(Escape-SqlString $createdAt),
  $(Escape-SqlString $trajet.DepartureCity),
  $(Escape-SqlString $departureDate.ToString("yyyy-MM-dd HH:mm:ss.ffffff", [System.Globalization.CultureInfo]::InvariantCulture)),
  $(Escape-SqlString $dayOfWeek),
  $($departureDate.Hour),
  $(Escape-SqlString $row.departurePoint),
  $($trajet.DistanceKm.ToString([System.Globalization.CultureInfo]::InvariantCulture)),
  $($trajet.EstimatedDurationMinutes),
  b'$isWeekend',
  $($occupancyRate.ToString([System.Globalization.CultureInfo]::InvariantCulture)),
  $ruleBasedDelayMinutes,
  $totalCapacity,
  b'$(if ($trafficJam) { 1 } else { 0 })',
  $(Escape-SqlString $row.status),
  $(Escape-SqlString $createdAt),
  b'0',
  $(Escape-SqlString $row.weather),
  $(To-SqlDouble $row.weatherPrecipitation),
  $(To-SqlDouble $row.weatherTemperature),
  $(To-SqlDouble $row.weatherWindSpeed),
  $(if ($null -eq $trajet.ArrivalStationId) { 'NULL' } else { $trajet.ArrivalStationId }),
  $(if ($null -eq $trajet.DepartureStationId) { 'NULL' } else { $trajet.DepartureStationId }),
  'BOOTSTRAP_IMPORT',
  $HostId,
  $trajetId,
  $transportId
)
"@.Trim())
}

$insertQuery = @"
INSERT INTO transport_ai_trip_dataset (
  id,
  actual_arrival_date,
  actual_delay_minutes,
  actual_departure_date,
  arrival_city,
  available_seats,
  base_price,
  booked_seats,
  created_at,
  departure_city,
  departure_date,
  departure_day_of_week,
  departure_hour,
  departure_point,
  distance_km,
  estimated_duration_minutes,
  is_weekend,
  occupancy_rate,
  rule_based_delay_minutes,
  total_capacity,
  traffic_jam,
  transport_status,
  updated_at,
  was_cancelled,
  weather,
  weather_precipitation,
  weather_temperature,
  weather_wind_speed,
  arrival_station_id,
  departure_station_id,
  data_origin,
  host_id,
  trajet_id,
  transport_id
) VALUES
$($valueLines -join ",`n");
"@

$tempSqlPath = Join-Path ([System.IO.Path]::GetDirectoryName($CsvPath)) "transport_ai_trip_dataset_import.sql"
[System.IO.File]::WriteAllText($tempSqlPath, $insertQuery, [System.Text.UTF8Encoding]::new($false))

$importOutput = Get-Content -LiteralPath $tempSqlPath -Raw | & $MysqlExe --protocol=tcp --host=$MysqlHost --port=$MysqlPort --user=$MysqlUser $Database 2>&1
if ($LASTEXITCODE -ne 0) {
    throw ($importOutput -join [Environment]::NewLine)
}

$summaryRows = Invoke-MysqlQuery -Query "SELECT COUNT(*) FROM transport_ai_trip_dataset WHERE host_id = $HostId;" -SkipColumnNames

Write-Host "AI trip dataset imported successfully." -ForegroundColor Green
Write-Host ("Host               : {0} ({1})" -f $hostEmail.Trim(), $HostId)
Write-Host ("CSV                : {0}" -f $CsvPath)
Write-Host ("Inserted rows       : {0}" -f $rows.Count)
Write-Host ("Host dataset total  : {0}" -f $summaryRows[0])
Write-Host ("SQL file            : {0}" -f $tempSqlPath)
