Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "Creating virtual environment (.venv)..." -ForegroundColor Cyan
python -m venv .venv

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
& .\.venv\Scripts\python -m pip install --upgrade pip
& .\.venv\Scripts\python -m pip install -r requirements.txt

Write-Host "Done. Next: run backend/dev.ps1" -ForegroundColor Green
