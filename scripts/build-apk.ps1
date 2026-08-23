# Build Android APK for BOEW Application
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  BOEW - Building Android Application     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WorkspaceRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$FrontendDir = Join-Path $WorkspaceRoot "artifacts\boew-frontend"
$AndroidDir = Join-Path $FrontendDir "android"

# 1. Setup Java Environment
$JbrPath = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $JbrPath) {
    $env:JAVA_HOME = $JbrPath
    $env:PATH = "$JbrPath\bin;" + $env:PATH
    Write-Host "[1/4] Using Android Studio JDK: $JbrPath" -ForegroundColor Green
} elseif ($env:JAVA_HOME) {
    Write-Host "[1/4] Using system JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Warning "JAVA_HOME not set. Build might fail if Java is not in PATH."
}

# 2. Setup Android SDK Environment
$SdkPath = "C:\Users\K.B.S PRADEEP\AppData\Local\Android\Sdk"
if (Test-Path $SdkPath) {
    $env:ANDROID_HOME = $SdkPath
    $env:ANDROID_SDK_ROOT = $SdkPath
    Write-Host "[2/4] Using Android SDK: $SdkPath" -ForegroundColor Green
}

# 3. Build Web Assets
Write-Host "[3/4] Compiling Web Frontend with Vite..." -ForegroundColor Cyan
Push-Location $FrontendDir
try {
    & npx pnpm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed with code $LASTEXITCODE"
    }

    Write-Host "Syncing assets to Android native project..." -ForegroundColor Cyan
    & npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Capacitor sync failed with code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

# 4. Compile Android APK with Gradle
Write-Host "[4/4] Compiling Android APK with Gradle..." -ForegroundColor Cyan
Push-Location $AndroidDir
try {
    & .\gradlew.bat assembleDebug --stacktrace
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle APK compilation failed with code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

$ApkPath = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $ApkPath) {
    $ApkItem = Get-Item $ApkPath
    $ApkSizeMb = [math]::Round($ApkItem.Length / 1MB, 2)
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "  SUCCESS: Android APK Created!            " -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "APK Location: $ApkPath" -ForegroundColor Yellow
    Write-Host "File Size   : $ApkSizeMb MB" -ForegroundColor Yellow
    Write-Host "`nTo install on a connected device/emulator:" -ForegroundColor Cyan
    Write-Host "  adb install `"$ApkPath`"" -ForegroundColor White
} else {
    Write-Error "APK file not found at expected location: $ApkPath"
}
