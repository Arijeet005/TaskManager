Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Test-Path ".\\.venv\\Scripts\\python.exe")) {
  throw "Virtual environment not found. Run backend\\setup.ps1 first."
}

Write-Host "Starting FastAPI on http://localhost:8000 ..." -ForegroundColor Cyan
& .\.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
