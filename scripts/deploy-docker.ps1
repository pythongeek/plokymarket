# Deploy Polymarket-Plus Docker Stack
$ProjectName = "polymarket-plus"
$EnvFile = ".env.docker"

Write-Host "Launching Polymarket-Plus..."

if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: .env.docker not found"
    exit 1
}

docker compose --project-name $ProjectName --env-file $EnvFile pull
docker compose --project-name $ProjectName --env-file $EnvFile up -d --build

Write-Host "Deployment Complete"
Write-Host "Main n8n: http://localhost:5678"
Write-Host "P2P Scraper: http://localhost:5680"
Write-Host "AI KYC: http://localhost:8000"
