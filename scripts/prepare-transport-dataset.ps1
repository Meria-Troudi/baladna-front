param(
    [Parameter(Mandatory = $true)]
    [string]$InputCsv,

    [Parameter(Mandatory = $true)]
    [string]$MappingCsv,

    [string]$OutputCsv,

    [int]$ExpectedRowCount = 1000,

    [int]$MinActualDelayMinutes = 0,

    [int]$MaxActualDelayMinutes = 120
)

$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

function Get-RequiredValue {
    param(
        [pscustomobject]$Row,
        [string]$PropertyName,
        [int]$RowNumber
    )

    $value = [string]$Row.$PropertyName
    $trimmed = $value.Trim()

    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        throw ("Row {0}: '{1}' is required." -f $RowNumber, $PropertyName)
    }

    return $trimmed
}

function Convert-ToIntValue {
    param(
        [string]$Value,
        [string]$FieldName,
        [int]$RowNumber
    )

    $parsedValue = 0
    if (-not [int]::TryParse($Value, [ref]$parsedValue)) {
        throw ("Row {0}: '{1}' must be an integer. Value: '{2}'." -f $RowNumber, $FieldName, $Value)
    }

    return $parsedValue
}

function Convert-ToDoubleValue {
    param(
        [string]$Value,
        [string]$FieldName,
        [int]$RowNumber
    )

    $parsedValue = 0.0
    if (-not [double]::TryParse($Value, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsedValue)) {
        throw ("Row {0}: '{1}' must be numeric. Value: '{2}'." -f $RowNumber, $FieldName, $Value)
    }

    return $parsedValue
}

function Convert-ToBoolValue {
    param(
        [string]$Value,
        [string]$FieldName,
        [int]$RowNumber
    )

    $normalized = $Value.Trim().ToLowerInvariant()
    if ($normalized -notin @('true', 'false')) {
        throw ("Row {0}: '{1}' must be true or false. Value: '{2}'." -f $RowNumber, $FieldName, $Value)
    }

    return $normalized
}

function Convert-ToDateValue {
    param(
        [string]$Value,
        [string]$FieldName,
        [int]$RowNumber
    )

    $parsedValue = [datetime]::MinValue
    if (-not [datetime]::TryParseExact($Value, 'yyyy-MM-ddTHH:mm:ss', [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::None, [ref]$parsedValue)) {
        throw ("Row {0}: '{1}' must use format yyyy-MM-ddTHH:mm:ss. Value: '{2}'." -f $RowNumber, $FieldName, $Value)
    }

    return $parsedValue
}

$requiredHeaders = @(
    'departurePoint',
    'departureDate',
    'totalCapacity',
    'availableSeats',
    'status',
    'basePrice',
    'trafficJam',
    'weather',
    'weatherSource',
    'weatherTemperature',
    'weatherWindSpeed',
    'weatherPrecipitation',
    'trajetId',
    'actualDelayMinutes'
)

$allowedWeather = @('SUNNY', 'RAIN', 'STORM', 'SANDSTORM')
$datasetIdentityColumns = @(
    'departurePoint',
    'departureDate',
    'totalCapacity',
    'availableSeats',
    'status',
    'basePrice',
    'trafficJam',
    'weather',
    'weatherSource',
    'weatherTemperature',
    'weatherWindSpeed',
    'weatherPrecipitation',
    'trajetId',
    'actualDelayMinutes'
)

$inputItem = Get-Item -LiteralPath $InputCsv
$mappingItem = Get-Item -LiteralPath $MappingCsv

if ([string]::IsNullOrWhiteSpace($OutputCsv)) {
    $outputFileName = '{0}.ready.csv' -f [System.IO.Path]::GetFileNameWithoutExtension($inputItem.Name)
    $OutputCsv = Join-Path $inputItem.DirectoryName $outputFileName
}

$inputRows = @(Import-Csv -LiteralPath $inputItem.FullName)
Assert-Condition ($inputRows.Count -gt 0) "Input CSV is empty: $($inputItem.FullName)"
Assert-Condition ($inputRows.Count -eq $ExpectedRowCount) "Expected $ExpectedRowCount rows, found $($inputRows.Count)."

$inputHeaders = @($inputRows[0].PSObject.Properties.Name)
Assert-Condition (($inputHeaders -join '|') -eq ($requiredHeaders -join '|')) ("Input CSV headers do not match the expected order. Found: " + ($inputHeaders -join ', '))

$mappingRows = @(Import-Csv -LiteralPath $mappingItem.FullName)
Assert-Condition ($mappingRows.Count -gt 0) "Mapping CSV is empty: $($mappingItem.FullName)"

$mappingHeaders = @($mappingRows[0].PSObject.Properties.Name)
Assert-Condition (($mappingHeaders -join '|') -eq ('tempTrajetId|realTrajetId')) ("Mapping CSV headers must be: tempTrajetId,realTrajetId. Found: " + ($mappingHeaders -join ', '))

$mappingLookup = @{}
$mappingRowNumber = 1
foreach ($mappingRow in $mappingRows) {
    $mappingRowNumber++
    $tempTrajetId = Convert-ToIntValue -Value (Get-RequiredValue -Row $mappingRow -PropertyName 'tempTrajetId' -RowNumber $mappingRowNumber) -FieldName 'tempTrajetId' -RowNumber $mappingRowNumber
    $realTrajetId = Convert-ToIntValue -Value (Get-RequiredValue -Row $mappingRow -PropertyName 'realTrajetId' -RowNumber $mappingRowNumber) -FieldName 'realTrajetId' -RowNumber $mappingRowNumber

    if ($mappingLookup.ContainsKey($tempTrajetId)) {
        throw "Duplicate tempTrajetId in mapping CSV: $tempTrajetId"
    }

    $mappingLookup[$tempTrajetId] = $realTrajetId
}

$distinctInputTrajetIds = @(
    $inputRows |
    ForEach-Object { Convert-ToIntValue -Value ([string]$_.trajetId).Trim() -FieldName 'trajetId' -RowNumber 0 } |
    Sort-Object -Unique
)

$missingMappings = @($distinctInputTrajetIds | Where-Object { -not $mappingLookup.ContainsKey($_) })
Assert-Condition ($missingMappings.Count -eq 0) ("Missing trajetId mapping(s): " + ($missingMappings -join ', '))

$now = Get-Date
$outputRows = New-Object System.Collections.Generic.List[object]

for ($index = 0; $index -lt $inputRows.Count; $index++) {
    $rowNumber = $index + 2
    $row = $inputRows[$index]

    $departurePoint = Get-RequiredValue -Row $row -PropertyName 'departurePoint' -RowNumber $rowNumber
    $departureDateRaw = Get-RequiredValue -Row $row -PropertyName 'departureDate' -RowNumber $rowNumber
    $totalCapacityRaw = Get-RequiredValue -Row $row -PropertyName 'totalCapacity' -RowNumber $rowNumber
    $availableSeatsRaw = Get-RequiredValue -Row $row -PropertyName 'availableSeats' -RowNumber $rowNumber
    $status = Get-RequiredValue -Row $row -PropertyName 'status' -RowNumber $rowNumber
    $basePriceRaw = Get-RequiredValue -Row $row -PropertyName 'basePrice' -RowNumber $rowNumber
    $trafficJam = Convert-ToBoolValue -Value (Get-RequiredValue -Row $row -PropertyName 'trafficJam' -RowNumber $rowNumber) -FieldName 'trafficJam' -RowNumber $rowNumber
    $weather = Get-RequiredValue -Row $row -PropertyName 'weather' -RowNumber $rowNumber
    $weatherSource = Get-RequiredValue -Row $row -PropertyName 'weatherSource' -RowNumber $rowNumber
    $weatherTemperatureRaw = Get-RequiredValue -Row $row -PropertyName 'weatherTemperature' -RowNumber $rowNumber
    $weatherWindSpeedRaw = Get-RequiredValue -Row $row -PropertyName 'weatherWindSpeed' -RowNumber $rowNumber
    $weatherPrecipitationRaw = Get-RequiredValue -Row $row -PropertyName 'weatherPrecipitation' -RowNumber $rowNumber
    $tempTrajetId = Convert-ToIntValue -Value (Get-RequiredValue -Row $row -PropertyName 'trajetId' -RowNumber $rowNumber) -FieldName 'trajetId' -RowNumber $rowNumber
    $actualDelayMinutes = Convert-ToIntValue -Value (Get-RequiredValue -Row $row -PropertyName 'actualDelayMinutes' -RowNumber $rowNumber) -FieldName 'actualDelayMinutes' -RowNumber $rowNumber

    $departureDate = Convert-ToDateValue -Value $departureDateRaw -FieldName 'departureDate' -RowNumber $rowNumber
    $totalCapacity = Convert-ToIntValue -Value $totalCapacityRaw -FieldName 'totalCapacity' -RowNumber $rowNumber
    $availableSeats = Convert-ToIntValue -Value $availableSeatsRaw -FieldName 'availableSeats' -RowNumber $rowNumber
    $basePrice = Convert-ToDoubleValue -Value $basePriceRaw -FieldName 'basePrice' -RowNumber $rowNumber
    $null = Convert-ToDoubleValue -Value $weatherTemperatureRaw -FieldName 'weatherTemperature' -RowNumber $rowNumber
    $null = Convert-ToDoubleValue -Value $weatherWindSpeedRaw -FieldName 'weatherWindSpeed' -RowNumber $rowNumber
    $null = Convert-ToDoubleValue -Value $weatherPrecipitationRaw -FieldName 'weatherPrecipitation' -RowNumber $rowNumber

    Assert-Condition ($status -eq 'COMPLETED') ("Row {0}: status must be COMPLETED. Found: '{1}'." -f $rowNumber, $status)
    Assert-Condition ($weather -in $allowedWeather) ("Row {0}: invalid weather '{1}'." -f $rowNumber, $weather)
    Assert-Condition ($weatherSource -eq 'AUTO') ("Row {0}: weatherSource must be AUTO. Found: '{1}'." -f $rowNumber, $weatherSource)
    Assert-Condition ($departureDate -lt $now) ("Row {0}: departureDate must be in the past." -f $rowNumber)
    Assert-Condition ($totalCapacity -ge 1 -and $totalCapacity -le 100) ("Row {0}: totalCapacity must be between 1 and 100." -f $rowNumber)
    Assert-Condition ($availableSeats -ge 0 -and $availableSeats -le $totalCapacity) ("Row {0}: availableSeats must be between 0 and totalCapacity." -f $rowNumber)
    Assert-Condition ($basePrice -gt 0) ("Row {0}: basePrice must be greater than 0." -f $rowNumber)
    Assert-Condition ($actualDelayMinutes -ge $MinActualDelayMinutes -and $actualDelayMinutes -le $MaxActualDelayMinutes) ("Row {0}: actualDelayMinutes must be between {1} and {2}." -f $rowNumber, $MinActualDelayMinutes, $MaxActualDelayMinutes)

    $outputRows.Add([pscustomobject][ordered]@{
            departurePoint       = $departurePoint
            departureDate        = $departureDateRaw
            totalCapacity        = $totalCapacityRaw
            availableSeats       = $availableSeatsRaw
            status               = $status
            basePrice            = $basePriceRaw
            trafficJam           = $trafficJam
            weather              = $weather
            weatherSource        = $weatherSource
            weatherTemperature   = $weatherTemperatureRaw
            weatherWindSpeed     = $weatherWindSpeedRaw
            weatherPrecipitation = $weatherPrecipitationRaw
            trajetId             = [string]$mappingLookup[$tempTrajetId]
            actualDelayMinutes   = [string]$actualDelayMinutes
        })
}

$duplicateGroups = @(
    $outputRows |
    Group-Object -Property $datasetIdentityColumns |
    Where-Object { $_.Count -gt 1 }
)
Assert-Condition ($duplicateGroups.Count -eq 0) "Duplicate rows detected after trajetId remapping."

$distinctOutputTrajetIds = @(
    $outputRows |
    Select-Object -ExpandProperty trajetId |
    Sort-Object -Unique
)

$outputRows | Export-Csv -LiteralPath $OutputCsv -NoTypeInformation -Encoding UTF8

Write-Host "Transport dataset prepared successfully." -ForegroundColor Green
Write-Host ("Input file          : {0}" -f $inputItem.FullName)
Write-Host ("Mapping file        : {0}" -f $mappingItem.FullName)
Write-Host ("Output file         : {0}" -f (Get-Item -LiteralPath $OutputCsv).FullName)
Write-Host ("Row count           : {0}" -f $outputRows.Count)
Write-Host ("Distinct trajetIds  : {0}" -f $distinctOutputTrajetIds.Count)
Write-Host ("Expected rows       : {0}" -f $ExpectedRowCount)
