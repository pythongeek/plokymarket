# Setup QStash Schedules for Advanced Workflow Verification System
# Run: .\scripts\setup-workflows-ps.ps1

$QSTASH_URL = "https://qstash.upstash.io"
$APP_URL = "https://polymarket-bangladesh.vercel.app"

# Read QSTASH_TOKEN from .env.local
$envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue
$QSTASH_TOKEN = ($envContent | Select-String "^QSTASH_TOKEN=").Line.Split("=")[1].Trim()

if (-not $QSTASH_TOKEN) {
    Write-Host "❌ Error: QSTASH_TOKEN not found in .env.local" -ForegroundColor Red
    Write-Host "   Get your token from: https://console.upstash.com/qstash"
    exit 1
}

Write-Host "🔧 Setting up Advanced Workflow Verification QStash Schedules`n" -ForegroundColor Cyan

$WORKFLOWS = @(
    @{
        name = "workflow-verification-crypto"
        description = "Verify crypto events every 5 minutes"
        cron = "*/5 * * * *"
        endpoint = "/api/workflows/execute-crypto"
    },
    @{
        name = "workflow-verification-sports"
        description = "Verify sports events every 10 minutes"
        cron = "*/10 * * * *"
        endpoint = "/api/workflows/execute-sports"
    },
    @{
        name = "workflow-verification-news"
        description = "Verify news events every 15 minutes"
        cron = "*/15 * * * *"
        endpoint = "/api/workflows/execute-news"
    },
    @{
        name = "workflow-escalation-check"
        description = "Check for escalated events every 5 minutes"
        cron = "*/5 * * * *"
        endpoint = "/api/workflows/check-escalations"
    },
    @{
        name = "workflow-analytics-daily"
        description = "Generate daily workflow analytics"
        cron = "0 0 * * *"
        endpoint = "/api/workflows/analytics/daily"
    }
)

# List existing schedules
Write-Host "📋 Checking existing schedules..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $QSTASH_TOKEN" }

try {
    $existing = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Headers $headers -Method GET
    
    # Delete existing workflow schedules
    foreach ($schedule in $existing) {
        $name = $schedule.headers."X-Workflow-Name"
        if ($name -and $name.StartsWith("workflow-")) {
            Write-Host "   🗑️  Deleting existing schedule: $($schedule.scheduleId)" -ForegroundColor Gray
            Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules/$($schedule.scheduleId)" -Headers $headers -Method DELETE
        }
    }
} catch {
    Write-Host "   ⚠️  Could not list existing schedules (this is OK if none exist)" -ForegroundColor Yellow
}

Write-Host "`n🚀 Creating new workflow schedules...`n" -ForegroundColor Green

# Create new schedules
foreach ($workflow in $WORKFLOWS) {
    try {
        $body = @{
            destination = "$APP_URL$($workflow.endpoint)"
            cron = $workflow.cron
            headers = @{
                "Content-Type" = "application/json"
                "X-Workflow-Name" = $workflow.name
            }
        } | ConvertTo-Json -Depth 3

        $response = Invoke-RestMethod -Uri "$QSTASH_URL/v2/schedules" -Headers $headers -Method POST -Body $body -ContentType "application/json"
        
        Write-Host "   ✅ Created: $($workflow.name) ($($workflow.cron))" -ForegroundColor Green
        Write-Host "      Schedule ID: $($response.scheduleId)" -ForegroundColor Gray
        Write-Host "      Endpoint: $($workflow.endpoint)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Failed to create $($workflow.name): $_" -ForegroundColor Red
    }
}

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "📊 Verify in Upstash Console: https://console.upstash.com/qstash/schedules" -ForegroundColor Cyan
Write-Host "`n📚 Workflow endpoints:" -ForegroundColor Yellow
foreach ($workflow in $WORKFLOWS) {
    Write-Host "   • $($workflow.name): $($workflow.cron)" -ForegroundColor White
}
