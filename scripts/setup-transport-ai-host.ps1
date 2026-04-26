param(
    [int]$HostId,
    [string]$HostEmail,
    [switch]$ListHosts,
    [switch]$ForceImport,
    [switch]$SkipImport,
    [switch]$SkipTraining,
    [int]$MinimumRows = 1000,
    [string]$CsvPath = "C:\Users\kacem\Downloads\baladna-frontend-develop\baladna-frontend-develop\scripts\generated\transport_dataset_v3.real-trajets.csv",
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

    $normalizedOutput = @($output | ForEach-Object { [string]$_ })
    return ,$normalizedOutput
}

function Parse-NullableDouble {
    param([string]$Value)

    $normalizedValue = if ([string]::IsNullOrWhiteSpace([string]$Value)) { "0" } else { [string]$Value }
    return [double]::Parse($normalizedValue, [System.Globalization.CultureInfo]::InvariantCulture)
}

function Get-HostDatasetStatus {
    param([int]$ResolvedHostId)

    $datasetRows = Invoke-MysqlQuery -Query @"
SELECT CONCAT(
  COUNT(*), '|',
  SUM(CASE WHEN actual_delay_minutes IS NOT NULL THEN 1 ELSE 0 END), '|',
  COUNT(DISTINCT trajet_id), '|',
  SUM(CASE WHEN data_origin = 'REAL' THEN 1 ELSE 0 END), '|',
  SUM(CASE WHEN data_origin = 'BOOTSTRAP_IMPORT' THEN 1 ELSE 0 END), '|',
  SUM(CASE WHEN data_origin = 'REAL' AND actual_delay_minutes IS NOT NULL THEN 1 ELSE 0 END), '|',
  SUM(CASE WHEN data_origin = 'BOOTSTRAP_IMPORT' AND actual_delay_minutes IS NOT NULL THEN 1 ELSE 0 END)
)
FROM transport_ai_trip_dataset
WHERE host_id = $ResolvedHostId;
"@ -SkipColumnNames

    $modelRows = Invoke-MysqlQuery -Query @"
SELECT CONCAT(
  IFNULL(id, ''), '|',
  IFNULL(sample_count, 0), '|',
  IFNULL(CAST(active AS UNSIGNED), 0), '|',
  IFNULL(mean_absolute_error, 0), '|',
  IFNULL(root_mean_squared_error, 0), '|',
  IFNULL(DATE_FORMAT(trained_at, '%Y-%m-%d %H:%i:%s'), '')
)
FROM transport_ai_delay_models
WHERE host_id = $ResolvedHostId
ORDER BY id DESC
LIMIT 1;
"@ -SkipColumnNames

    $datasetParts = if ($datasetRows.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace([string]$datasetRows[0])) {
        ([string]$datasetRows[0]).Trim() -split '\|'
    } else {
        @("0", "0", "0", "0", "0", "0", "0")
    }

    $modelParts = if ($modelRows.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace([string]$modelRows[0])) {
        ([string]$modelRows[0]).Trim() -split '\|'
    } else {
        @("", "0", "0", "0", "0", "")
    }

    return [pscustomobject]@{
        TotalRows             = [int]$datasetParts[0]
        TrainingReadyRows     = [int]$datasetParts[1]
        DistinctTrajets       = [int]$datasetParts[2]
        RealRows              = [int]$datasetParts[3]
        BootstrapRows         = [int]$datasetParts[4]
        RealTrainingReadyRows = [int]$datasetParts[5]
        BootstrapTrainingReadyRows = [int]$datasetParts[6]
        ModelId               = if ($modelParts[0]) { [int]$modelParts[0] } else { $null }
        ModelSampleCount      = [int]$modelParts[1]
        ModelActive           = ($modelParts[2] -eq "1")
        ModelMeanAbsoluteError = Parse-NullableDouble $modelParts[3]
        ModelRmse             = Parse-NullableDouble $modelParts[4]
        ModelTrainedAt        = $modelParts[5]
    }
}

function Resolve-Host {
    if ($HostId -gt 0) {
        $rows = Invoke-MysqlQuery -Query "SELECT id, email, UPPER(TRIM(role)) FROM user WHERE id = $HostId;" -SkipColumnNames
    } elseif (-not [string]::IsNullOrWhiteSpace($HostEmail)) {
        $escapedEmail = $HostEmail.Replace("\", "\\").Replace("'", "''")
        $rows = Invoke-MysqlQuery -Query "SELECT id, email, UPPER(TRIM(role)) FROM user WHERE email = '$escapedEmail';" -SkipColumnNames
    } else {
        throw "Provide -HostId or -HostEmail, or use -ListHosts."
    }

    if ($rows.Count -eq 0 -or [string]::IsNullOrWhiteSpace([string]$rows[0])) {
        throw "Target host was not found."
    }

    $parts = ([string]$rows[0]).Trim() -split "`t"
    if ($parts.Count -lt 3 -or $parts[2] -ne "HOST") {
        throw "Target user exists but is not a HOST."
    }

    return [pscustomobject]@{
        Id = [int]$parts[0]
        Email = $parts[1]
    }
}

if (-not (Test-Path -LiteralPath $MysqlExe)) {
    throw "mysql.exe not found: $MysqlExe"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ensureDataOriginScriptPath = Join-Path $scriptRoot "ensure-transport-ai-data-origin.ps1"
$importScriptPath = Join-Path $scriptRoot "import-transport-ai-trip-dataset.ps1"
$trainScriptPath = Join-Path $scriptRoot "train-transport-ai-delay-model.js"

if (Test-Path -LiteralPath $ensureDataOriginScriptPath) {
    & powershell -ExecutionPolicy Bypass -File $ensureDataOriginScriptPath -MysqlExe $MysqlExe -MysqlHost $MysqlHost -MysqlPort $MysqlPort -MysqlUser $MysqlUser -Database $Database
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to prepare the data_origin column before host AI setup."
    }
}

if ($ListHosts) {
    $hostRows = Invoke-MysqlQuery -Query @"
SELECT CONCAT(
  u.id, '|',
  u.email, '|',
  COALESCE(COUNT(d.id), 0), '|',
  COALESCE(SUM(CASE WHEN d.actual_delay_minutes IS NOT NULL THEN 1 ELSE 0 END), 0), '|',
  COALESCE(COUNT(DISTINCT d.trajet_id), 0), '|',
  COALESCE(SUM(CASE WHEN d.data_origin = 'REAL' AND d.actual_delay_minutes IS NOT NULL THEN 1 ELSE 0 END), 0), '|',
  COALESCE(SUM(CASE WHEN d.data_origin = 'BOOTSTRAP_IMPORT' AND d.actual_delay_minutes IS NOT NULL THEN 1 ELSE 0 END), 0)
)
FROM user u
LEFT JOIN transport_ai_trip_dataset d ON d.host_id = u.id
WHERE UPPER(TRIM(u.role)) = 'HOST'
GROUP BY u.id, u.email
ORDER BY u.id;
"@ -SkipColumnNames

    Write-Host "Available HOST accounts" -ForegroundColor Cyan
    foreach ($hostRow in $hostRows) {
        $parts = ([string]$hostRow).Trim() -split '\|'
        Write-Host ("- {0} | id={1} | dataset={2} | ready={3} | trajets={4} | realReady={5} | bootstrapReady={6}" -f $parts[1], $parts[0], $parts[2], $parts[3], $parts[4], $parts[5], $parts[6])
    }
    return
}

$targetHost = Resolve-Host
$before = Get-HostDatasetStatus -ResolvedHostId $targetHost.Id

Write-Host ("Target host         : {0} ({1})" -f $targetHost.Email, $targetHost.Id) -ForegroundColor Cyan
Write-Host ("Current dataset     : {0} rows / {1} training-ready / {2} trajets" -f $before.TotalRows, $before.TrainingReadyRows, $before.DistinctTrajets)
Write-Host ("Dataset split       : {0} real ({1} ready) / {2} bootstrap ({3} ready)" -f $before.RealRows, $before.RealTrainingReadyRows, $before.BootstrapRows, $before.BootstrapTrainingReadyRows)
Write-Host ("Current model       : {0}" -f $(if ($before.ModelId) { "id=$($before.ModelId), active=$($before.ModelActive), samples=$($before.ModelSampleCount), mae=$($before.ModelMeanAbsoluteError), rmse=$($before.ModelRmse)" } else { "none" }))

$shouldImport = $false
if (-not $SkipImport) {
    if ($ForceImport -or $before.TrainingReadyRows -lt $MinimumRows) {
        $shouldImport = $true
    }
}

if ($shouldImport) {
    if (-not (Test-Path -LiteralPath $CsvPath)) {
        throw "CSV file not found: $CsvPath"
    }

    Write-Host ("Importing dataset   : {0}" -f $CsvPath) -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File $importScriptPath -HostId $targetHost.Id -CsvPath $CsvPath -MysqlExe $MysqlExe -MysqlHost $MysqlHost -MysqlPort $MysqlPort -MysqlUser $MysqlUser -Database $Database
    if ($LASTEXITCODE -ne 0) {
        throw "Dataset import failed for host id $($targetHost.Id)."
    }
}

$afterImport = Get-HostDatasetStatus -ResolvedHostId $targetHost.Id
if ($afterImport.TrainingReadyRows -lt $MinimumRows) {
    throw "Host $($targetHost.Email) still has only $($afterImport.TrainingReadyRows) training-ready rows. Minimum required: $MinimumRows."
}

if (-not $SkipTraining) {
    Write-Host "Training model      : started" -ForegroundColor Yellow
    & node $trainScriptPath --host-id $targetHost.Id --mysql-exe $MysqlExe --mysql-host $MysqlHost --mysql-port $MysqlPort --mysql-user $MysqlUser --database $Database
    if ($LASTEXITCODE -ne 0) {
        throw "Model training failed for host id $($targetHost.Id)."
    }
}

$after = Get-HostDatasetStatus -ResolvedHostId $targetHost.Id

Write-Host ""
Write-Host "Transport AI host setup complete." -ForegroundColor Green
Write-Host ("Host                : {0} ({1})" -f $targetHost.Email, $targetHost.Id)
Write-Host ("Dataset             : {0} rows / {1} training-ready / {2} trajets" -f $after.TotalRows, $after.TrainingReadyRows, $after.DistinctTrajets)
Write-Host ("Dataset split       : {0} real ({1} ready) / {2} bootstrap ({3} ready)" -f $after.RealRows, $after.RealTrainingReadyRows, $after.BootstrapRows, $after.BootstrapTrainingReadyRows)
Write-Host ("Latest model        : {0}" -f $(if ($after.ModelId) { "id=$($after.ModelId), active=$($after.ModelActive), samples=$($after.ModelSampleCount), mae=$($after.ModelMeanAbsoluteError), rmse=$($after.ModelRmse), trainedAt=$($after.ModelTrainedAt)" } else { "none" }))
