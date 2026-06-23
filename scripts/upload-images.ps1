# Upload public/images to production server (handles long paths via Git Bash tar).
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$Bash = "C:\Program Files\Git\bin\bash.exe"
if (-not (Test-Path $Bash)) {
  Write-Error "Git Bash required: install Git for Windows"
}
$Images = "$ProjectRoot/public/images"
if (-not (Test-Path $Images)) {
  Write-Error "Missing $Images"
}
Write-Host "Uploading images (~5GB) to root@167.233.112.233:/opt/apkbay/public/images ..."
& $Bash -lc "tar -C '$($ProjectRoot -replace '\\','/')/public' -cf - images | ssh -o BatchMode=yes root@167.233.112.233 'cd /opt/apkbay/public && tar -xf -'"
Write-Host "Done."
