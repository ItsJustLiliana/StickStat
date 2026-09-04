[CmdletBinding()]
param(
    [ValidateSet("release", "debug")]
    [string]$Configuration = "release",
    [ValidatePattern("^https?://")]
    [string]$AppUrl = "http://archlinux.tail50bfa9.ts.net:4000",
    [ValidatePattern("^\d+\.\d+\.\d+$")]
    [string]$Version,
    [int]$BuildNumber,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $repoRoot "mobile"
$projectsRoot = Split-Path -Parent $repoRoot
$pubspecPath = Join-Path $mobileRoot "pubspec.yaml"
$versionConfigPath = Join-Path $mobileRoot "app-version.json"

if (-not $Version -and $BuildNumber -le 0) {
    if (-not (Test-Path -LiteralPath $versionConfigPath)) {
        throw "Versieconfiguratie niet gevonden op $versionConfigPath."
    }
    $versionConfig = Get-Content -LiteralPath $versionConfigPath -Raw | ConvertFrom-Json
    $Version = [string] $versionConfig.version
    if ($Version -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
        throw "Ongeldige versie '$Version' in $versionConfigPath. Gebruik bijvoorbeeld 1.2.3."
    }
    $major = [int] $Matches[1]
    $minor = [int] $Matches[2]
    $patch = [int] $Matches[3]
    if ($minor -gt 999 -or $patch -gt 999) {
        throw "Minor- en patchnummers mogen maximaal 999 zijn."
    }
    $BuildNumber = $major * 1000000 + $minor * 1000 + $patch
    if ($BuildNumber -le 0 -or $BuildNumber -gt 2100000000) {
        throw "Versie $Version levert geen geldig Android-buildnummer op."
    }
}

if (($Version -and $BuildNumber -le 0) -or (-not $Version -and $BuildNumber -gt 0)) {
    throw "Geef -Version en -BuildNumber altijd samen op."
}

if ($Version -and $BuildNumber -gt 0) {
    $pubspec = Get-Content -LiteralPath $pubspecPath -Raw
    if ($pubspec -notmatch '(?m)^version:\s*\d+\.\d+\.\d+\+\d+\s*$') {
        throw "De huidige appversie kon niet in $pubspecPath worden gevonden."
    }
    $updatedPubspec = [regex]::Replace(
        $pubspec,
        '(?m)^version:\s*\d+\.\d+\.\d+\+\d+\s*$',
        "version: $Version+$BuildNumber"
    )
    Set-Content -LiteralPath $pubspecPath -Value $updatedPubspec -Encoding UTF8 -NoNewline
    Write-Host "Appversie vastgelegd: $Version+$BuildNumber" -ForegroundColor Green
}

function Find-Flutter {
    $candidates = @()
    if ($env:FLUTTER_HOME) { $candidates += $env:FLUTTER_HOME }
    $candidates += (Join-Path $projectsRoot "DartMeister\.flutter")
    $command = Get-Command flutter.bat -ErrorAction SilentlyContinue
    if ($command) { $candidates += (Split-Path -Parent (Split-Path -Parent $command.Source)) }

    foreach ($candidate in $candidates) {
        if (-not $candidate) { continue }
        $flutter = Join-Path $candidate "bin\flutter.bat"
        if (Test-Path -LiteralPath $flutter) { return @{ Root = $candidate; Command = $flutter } }
    }
    throw "Flutter niet gevonden. Zet FLUTTER_HOME of plaats de SDK in DartMeister\.flutter."
}

function Find-AndroidSdk {
    $candidates = @($env:ANDROID_SDK_ROOT, $env:ANDROID_HOME, (Join-Path $env:LOCALAPPDATA "Android\sdk"))
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) { return $candidate }
    }
    throw "Android SDK niet gevonden. Zet ANDROID_SDK_ROOT of installeer de SDK via Android Studio."
}

function Find-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME "bin\java.exe"))) { return $env:JAVA_HOME }
    $candidates = @(
        "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot",
        "C:\Program Files\Java\jdk-17"
    )
    $microsoftJdks = Get-ChildItem "C:\Program Files\Microsoft" -Directory -Filter "jdk-17*" -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    $candidates = @($microsoftJdks.FullName) + $candidates
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath (Join-Path $candidate "bin\java.exe"))) { return $candidate }
    }
    throw "Java 17 niet gevonden. Installeer een JDK 17 of zet JAVA_HOME."
}

function Invoke-Step([string]$Name, [scriptblock]$Action) {
    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "$Name is mislukt (exitcode $LASTEXITCODE)." }
}

$flutter = Find-Flutter
$androidSdk = Find-AndroidSdk
$env:JAVA_HOME = Find-JavaHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = "$(Join-Path $env:JAVA_HOME 'bin');$(Join-Path $androidSdk 'platform-tools');$env:Path"

$propertiesPath = Join-Path $mobileRoot "android\local.properties"
$propertyLines = @(
    "sdk.dir=$($androidSdk.Replace('\', '/'))",
    "flutter.sdk=$($flutter.Root.Replace('\', '/'))"
)
Set-Content -LiteralPath $propertiesPath -Value $propertyLines -Encoding ASCII

Write-Host "StickStat APK build" -ForegroundColor Green
Write-Host "Flutter: $($flutter.Root)"
Write-Host "Android SDK: $androidSdk"
Write-Host "Java: $env:JAVA_HOME"
Write-Host "Configuratie: $Configuration"
Write-Host "StickStat URL: $AppUrl"

$appLogo = Join-Path $mobileRoot "assets\branding\app_logo.png"
$iconSyncScript = Join-Path $PSScriptRoot "sync-app-icons.ps1"
if (Test-Path -LiteralPath $appLogo) {
    Write-Host ""
    Write-Host "==> App-logo verwerken" -ForegroundColor Cyan
    & $iconSyncScript -Source $appLogo
} else {
    Write-Warning "Geen eigen app-logo gevonden op $appLogo; de bestaande launcher-iconen blijven staan."
}

Push-Location $mobileRoot
try {
    Invoke-Step "Dependencies ophalen" { & $flutter.Command pub get }
    Invoke-Step "Dart analyseren" { & $flutter.Command analyze }
    if (-not $SkipTests) { Invoke-Step "Flutter-tests uitvoeren" { & $flutter.Command test } }
    Invoke-Step "APK bouwen" {
        $buildArgs = @("build", "apk", "--$Configuration", "--dart-define=STICKSTAT_URL=$AppUrl")
        if ($Version) { $buildArgs += "--build-name=$Version" }
        if ($BuildNumber -gt 0) { $buildArgs += "--build-number=$BuildNumber" }
        & $flutter.Command @buildArgs
    }

    $sourceApk = Join-Path $mobileRoot "build\app\outputs\flutter-apk\app-$Configuration.apk"
    if (-not (Test-Path -LiteralPath $sourceApk)) { throw "Flutter meldde succes, maar $sourceApk ontbreekt." }

    $dist = Join-Path $mobileRoot "dist"
    New-Item -ItemType Directory -Path $dist -Force | Out-Null
    $outputApk = Join-Path $dist "StickStat.apk"
    Copy-Item -LiteralPath $sourceApk -Destination $outputApk -Force
    $sizeMb = [math]::Round((Get-Item -LiteralPath $outputApk).Length / 1MB, 1)
    $hash = (Get-FileHash -LiteralPath $outputApk -Algorithm SHA256).Hash

    Write-Host ""
    Write-Host "APK gereed: $outputApk" -ForegroundColor Green
    Write-Host "Grootte: $sizeMb MB"
    Write-Host "SHA256: $hash"
} finally {
    Pop-Location
}
