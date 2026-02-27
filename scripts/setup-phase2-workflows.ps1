# Phase 2 QStash Workflow Setup (PowerShell)
# Run: .\scripts\setup-phase2-workflows.ps1

param(
    [string]$DeploymentUrl = $env:DEPLOYMENT_URL
)

if (-not $env:QSTASH_TOKEN) {
    Write-Host "❌ Error: QSTASH_TOKEN environment variable is required" -ForegroundColor Red
    Write-Host "Set it with: `$env:QSTASH_TOKEN='your_token'" -ForegroundColor Yellow
    exit 1
}

if (-not $DeploymentUrl) {
    Write-Host "❌ Error: DEPLOYMENT_URL is required" -ForegroundColor Red
    Write-Host "Set it with: `$env:DEPLOYMENT_URL='https://your-app.vercel.app'" -ForegroundColor Yellow
    exit 1
}

$QSTASH_TOKEN = $env:QSTASH_TOKEN
$QSTASH_URL = $env:QSTASH_URL
if (-not $QSTASH_URL) {
    $QSTASH_URL = "https://qstash.upstash.io/v2/publish/"
}

$headers = @{
    "Authorization" = "Bearer $QSTASH_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Plokymarket Phase 2 - QStash Workflow Setup       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment URL: $DeploymentUrl" -ForegroundColor Gray
Write-Host "QStash URL: $QSTASH_URL" -ForegroundColor Gray
Write-Host ""

# Workflow definitions
$workflows = @(
    @{
        Name = "Price Snapshot"
        Endpoint = "/api/upstash-workflow/price-snapshot"
        Schedule = "0 * * * *"
        Description = "Records hourly price snapshots for all active markets"
    },
    @{
        Name = "Market Close Check"
        Endpoint = "/api/upstash-workflow/market-close-check"
        Schedule = "*/15 * * * *"
        Description = "Checks for markets closing in <1 hour and sends notifications"
    },
    @{
        Name = "Daily Cleanup"
        Endpoint = "/api/upstash-workflow/cleanup"
        Schedule = "0 0 * * *"
        Description = "Cleans up expired batches and old notifications"
    }
)

$results = @()

foreach ($workflow in $workflows) {
    Write-Host "📋 Setting up: $($workflow.Name)" -ForegroundColor Cyan
    Write-Host "   Endpoint: $DeploymentUrl$($workflow.Endpoint)" -ForegroundColor Gray
    Write-Host "   Schedule: $($workflow.Schedule)" -ForegroundColor Gray
    
    $url = "$QSTASH_URL$DeploymentUrl$($workflow.Endpoint)"
    $headers["Upstash-Cron"] = $workflow.Schedule
    
    $body = @{
        step = "init"
        setup = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "   ✅ Success!" -ForegroundColor Green
        $results += @{ Success = $true; Name = $workflow.Name }
    }
    catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{ Success = $false; Name = $workflow.Name; Error = $_.Exception.Message }
    }
    Write-Host ""
}

# Summary
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      Summary                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$successful = $results | Where-Object { $_.Success }
$failed = $results | Where-Object { -not $_.Success }

Write-Host "✅ Successful: $($successful.Count)/$($workflows.Count)" -ForegroundColor Green
$successful | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Green }

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Failed: $($failed.Count)" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "   - $($_.Name): $($_.Error)" -ForegroundColor Red }
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify workflows are scheduled in Upstash dashboard"
Write-Host "   2. Check /api/upstash-workflow/*/health endpoints"
Write-Host "   3. Monitor logs for any issues"
Write-Host ""
Write-Host "🔗 Useful URLs:" -ForegroundColor Cyan
Write-Host "   - Price Snapshot: $DeploymentUrl/api/upstash-workflow/price-snapshot"
Write-Host "   - Market Close Check: $DeploymentUrl/api/upstash-workflow/market-close-check"
Write-Host "   - Cleanup: $DeploymentUrl/api/upstash-workflow/cleanup"
