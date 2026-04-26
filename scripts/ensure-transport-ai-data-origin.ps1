param(
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

if (-not (Test-Path -LiteralPath $MysqlExe)) {
    throw "mysql.exe not found: $MysqlExe"
}

$columnRows = Invoke-MysqlQuery -Query @"
SELECT COUNT(*)
FROM information_schema.columns
WHERE table_schema = '$Database'
  AND table_name = 'transport_ai_trip_dataset'
  AND column_name = 'data_origin';
"@ -SkipColumnNames

$hasColumn = $columnRows.Count -gt 0 -and ([int]$columnRows[0]) -gt 0

if (-not $hasColumn) {
    Invoke-MysqlQuery -Query "ALTER TABLE transport_ai_trip_dataset ADD COLUMN data_origin VARCHAR(30) NOT NULL DEFAULT 'REAL';" | Out-Null
    $verificationRows = Invoke-MysqlQuery -Query @"
SELECT COUNT(*)
FROM information_schema.columns
WHERE table_schema = '$Database'
  AND table_name = 'transport_ai_trip_dataset'
  AND column_name = 'data_origin';
"@ -SkipColumnNames
    if ($verificationRows.Count -eq 0 -or ([int]$verificationRows[0]) -eq 0) {
        throw "Failed to add data_origin column to transport_ai_trip_dataset."
    }
}

$backfillQuery = @"
UPDATE transport_ai_trip_dataset d
LEFT JOIN transports t ON t.id = d.transport_id
SET data_origin = CASE
  WHEN t.id IS NOT NULL THEN 'REAL'
  ELSE 'BOOTSTRAP_IMPORT'
END;
"@

& $MysqlExe --protocol=tcp --host=$MysqlHost --port=$MysqlPort --user=$MysqlUser $Database -e $backfillQuery 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Failed to backfill data_origin values in transport_ai_trip_dataset."
}

$summaryRows = Invoke-MysqlQuery -Query @"
SELECT
  COUNT(*),
  COALESCE(SUM(CASE WHEN data_origin = 'REAL' THEN 1 ELSE 0 END), 0),
  COALESCE(SUM(CASE WHEN data_origin = 'BOOTSTRAP_IMPORT' THEN 1 ELSE 0 END), 0)
FROM transport_ai_trip_dataset;
"@ -SkipColumnNames

$parts = if ($summaryRows.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace([string]$summaryRows[0])) {
    ([string]$summaryRows[0]).Trim() -split "`t"
} else {
    @("0", "0", "0")
}

Write-Host "transport_ai_trip_dataset data_origin is ready." -ForegroundColor Green
Write-Host ("Total rows          : {0}" -f $parts[0])
Write-Host ("REAL rows           : {0}" -f $parts[1])
Write-Host ("BOOTSTRAP rows      : {0}" -f $parts[2])
