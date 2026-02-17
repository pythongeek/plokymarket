# Upstash QStash Setup Script
# This script uses your Upstash credentials to get QStash token and create schedule

param(
    [string]$AppUrl = "https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app"
)

# Decode credentials from your token
$encodedToken = "eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0="
$decodedBytes = [System.Convert]::FromBase64String($encodedToken)
$credentials = [System.Text.Encoding]::UTF8.GetString($decodedBytes) | ConvertFrom-Json

$UserId = $credentials.UserID
$Password = $credentials.Password

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Upstash QStash Setup via CLI                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "UserID: $UserId" -ForegroundColor Gray
Write-Host ""

# Step 1: Login to Upstash API
Write-Host "🔐 Logging into Upstash API..." -ForegroundColor Yellow

$loginBody = @{
    email = $UserId
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "https://api.upstash.com/v2/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "✅ Login successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get team and project info
Write-Host ""
Write-Host "📋 Fetching projects..." -ForegroundColor Yellow

try {
    $teams = Invoke-RestMethod -Uri "https://api.upstash.com/v2/teams" -Method GET -Headers @{ "Authorization" = "Bearer $loginResponse.token" }
    
    if ($teams.Count -eq 0) {
        Write-Host "❌ No teams found" -ForegroundColor Red
        exit 1
    }
    
    $teamId = $teams[0].team_id
    Write-Host "✅ Found team: $($teams[0].name)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to fetch teams: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Get QStash token
Write-Host ""
Write-Host "🔑 Fetching QStash token..." -ForegroundColor Yellow

try {
    $qstashKeys = Invoke-RestMethod -Uri "https://api.upstash.com/v2/qstash/keys?team_id=$teamId" -Method GET -Headers @{ "Authorization" = "Bearer $loginResponse.token" }
    
    $qstashToken = $qstashKeys.token
    Write-Host "✅ QStash token retrieved!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to fetch QStash keys: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Try getting from Redis/QStash endpoint
    try {
        $qstashInfo = Invoke-RestMethod -Uri "https://api.upstash.com/v2/qstash?team_id=$teamId" -Method GET -Headers @{ "Authorization" = "Bearer $loginResponse.token" }
        Write-Host "✅ QStash info retrieved!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Alternative method also failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please create the schedule manually:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://console.upstash.com/qstash/schedules" -ForegroundColor Cyan
        Write-Host "2. Click 'Create Schedule'" -ForegroundColor Cyan
        Write-Host "3. Destination: $AppUrl/api/cron/batch-markets" -ForegroundColor Cyan
        Write-Host "4. Method: GET" -ForegroundColor Cyan
        Write-Host "5. Cron: 0,15,30,45 * * * *" -ForegroundColor Cyan
        exit 1
    }
}

# Step 4: Create schedule
Write-Host ""
Write-Host "🔄 Creating QStash Schedule..." -ForegroundColor Yellow
Write-Host "   Destination: $AppUrl/api/cron/batch-markets" -ForegroundColor Gray
Write-Host "   Schedule: Every 15 minutes" -ForegroundColor Gray
Write-Host ""

$scheduleBody = @{
    destination = "$AppUrl/api/cron/batch-markets"
    cron = "0,15,30,45 * * * *"
    method = "GET"
    retries = 3
} | ConvertTo-Json

try {
    $schedule = Invoke-RestMethod -Uri "https://qstash.upstash.io/v2/schedules" -Method POST -Headers @{ 
        "Authorization" = "Bearer $qstashToken"
        "Content-Type" = "application/json"
    } -Body $scheduleBody
    
    Write-Host "✅ Schedule created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Schedule Details:" -ForegroundColor Cyan
    Write-Host "  Schedule ID: $($schedule.scheduleId)" -ForegroundColor White
    Write-Host "  Next Run: $([DateTime]::Now.AddMinutes(15).ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
    Write-Host "  Runs per day: 96" -ForegroundColor White
    Write-Host ""
    Write-Host "To verify, check: https://console.upstash.com/qstash/schedules" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Failed to create schedule: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create manually at: https://console.upstash.com/qstash/schedules" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
