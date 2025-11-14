# Build Script for YouTube Downloader Single Executable Application
# Enhanced version with error handling and progress indicators

Write-Host "Building YouTube Downloader Single Executable Application..." -ForegroundColor Green

# Clean up old executable
if (Test-Path "YoutubeDownloader.exe") {
    Write-Host "Removing old executable..." -ForegroundColor Yellow
    Remove-Item YoutubeDownloader.exe -Force
}

# Step 2: Generate the SEA blob
Write-Host "`n[1/5] Generating SEA preparation blob..." -ForegroundColor Cyan
node --experimental-sea-config sea-config.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "SEA blob generation failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Copy Node.js executable
Write-Host "`n[2/5] Creating copy of Node.js executable..." -ForegroundColor Cyan
node -e "require('fs').copyFileSync(process.execPath, 'YoutubeDownloader.exe')"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to copy Node.js executable!" -ForegroundColor Red
    exit 1
}

# Step 4: Remove signature (Windows - optional but recommended)
Write-Host "`n[3/5] Removing signature (if signtool is available)..." -ForegroundColor Cyan
$signtool = Get-Command signtool -ErrorAction SilentlyContinue
if ($signtool) {
    & signtool remove /s YoutubeDownloader.exe 2>$null
    Write-Host "Signature removed successfully" -ForegroundColor Green
} else {
    Write-Host "signtool not found, skipping signature removal (this is optional)" -ForegroundColor Yellow
}

# Step 5: Inject the blob using postject
Write-Host "`n[4/5] Injecting blob into executable..." -ForegroundColor Cyan
npx postject YoutubeDownloader.exe NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
if ($LASTEXITCODE -ne 0) {
    Write-Host "Blob injection failed!" -ForegroundColor Red
    exit 1
}

# Step 6: Set icon using rcedit
Write-Host "`n[5/5] Setting application icon..." -ForegroundColor Cyan
if (Test-Path "icon.ico") {
    npx rcedit YoutubeDownloader.exe --set-icon icon.ico
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Icon set successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to set icon, but executable is still usable" -ForegroundColor Yellow
    }
} else {
    Write-Host "icon.ico not found, skipping icon setup" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYoutubeDownloader.exe is ready to use." -ForegroundColor Cyan
Write-Host "`nIMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Place ffmpeg.exe in the same directory as YoutubeDownloader.exe" -ForegroundColor White
Write-Host "  - Optionally place _cookie.txt for authenticated YouTube access" -ForegroundColor White
Write-Host ""
