$ErrorActionPreference = "Stop"
Write-Host "Opsynq Windows dependency repair" -ForegroundColor Cyan
Write-Host "This script does not read, replace, or modify any .env file." -ForegroundColor DarkGray

if (Test-Path ".\\node_modules") {
  Write-Host "Removing node_modules..."
  Remove-Item -Recurse -Force ".\\node_modules"
}
if (Test-Path ".\\package-lock.json") {
  Write-Host "Removing package-lock.json..."
  Remove-Item -Force ".\\package-lock.json"
}

npm cache verify
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Installing dependencies (including Windows optional/native packages)..."
npm install --include=optional --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run doctor
exit $LASTEXITCODE
