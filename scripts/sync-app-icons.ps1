[CmdletBinding()]
param(
    [string]$Source = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$mobileRoot = Join-Path $repoRoot "mobile"
$sourcePath = if ($Source) { $Source } else { Join-Path $mobileRoot "assets\branding\app_logo.png" }

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "App-logo niet gevonden op $sourcePath. Plaats daar een vierkante PNG van minimaal 512x512 pixels."
}

Add-Type -AssemblyName System.Drawing
$sizes = [ordered]@{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

function Save-SquarePng {
    param(
        [Parameter(Mandatory = $true)] [System.Drawing.Image] $SourceImage,
        [Parameter(Mandatory = $true)] [string] $TargetPath,
        [Parameter(Mandatory = $true)] [int] $Size
    )

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $scale = [Math]::Min($Size / $SourceImage.Width, $Size / $SourceImage.Height)
            $width = [int] [Math]::Round($SourceImage.Width * $scale)
            $height = [int] [Math]::Round($SourceImage.Height * $scale)
            $x = [int] [Math]::Floor(($Size - $width) / 2)
            $y = [int] [Math]::Floor(($Size - $height) / 2)
            $graphics.DrawImage($SourceImage, $x, $y, $width, $height)
        } finally {
            $graphics.Dispose()
        }
        $bitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "App-icoon bijgewerkt: $TargetPath ($($Size)x$($Size))"
    } finally {
        $bitmap.Dispose()
    }
}

$image = [System.Drawing.Image]::FromFile($sourcePath)
try {
    if ($image.Width -lt 512 -or $image.Height -lt 512) {
        throw "Het app-logo moet minimaal 512x512 pixels zijn; ontvangen: $($image.Width)x$($image.Height)."
    }
    foreach ($entry in $sizes.GetEnumerator()) {
        $target = Join-Path $mobileRoot "android\app\src\main\res\$($entry.Key)\ic_launcher.png"
        Save-SquarePng -SourceImage $image -TargetPath $target -Size ([int] $entry.Value)
    }
} finally {
    $image.Dispose()
}
