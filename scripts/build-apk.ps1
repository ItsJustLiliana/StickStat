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
