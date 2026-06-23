# Upload local SQLite database to production (run after scraping/import locally).
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$Db = "$ProjectRoot/prisma/dev.db"
if (-not (Test-Path $Db)) { Write-Error "Missing $Db" }
Write-Host "Stopping apkbay-web and uploading database..."
ssh -o BatchMode=yes root@167.233.112.233 "docker stop apkbay-web"
scp -o BatchMode=yes $Db root@167.233.112.233:/opt/apkbay/data/prod.db
ssh -o BatchMode=yes root@167.233.112.233 "chown 1001:1001 /opt/apkbay/data/prod.db && docker start apkbay-web"
Write-Host "Done. Database uploaded to /opt/apkbay/data/prod.db"
