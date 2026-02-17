# Plokymarket Test Event Creation Script

Write-Host "🚀 Plokymarket Test Event Creation" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Step 1: Authenticate with Supabase
Write-Host "📋 Step 1: Authenticating admin user..." -ForegroundColor Yellow

$supabaseUrl = "https://sltcfmqefujecqfbmkvz.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE"

$authHeaders = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
}

$authBody = @{
    email = "admin@plokymarket.bd"
    password = "PlokyAdmin2026!"
} | ConvertTo-Json

try {
    $authResponse = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Method POST -Headers $authHeaders -Body $authBody -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
    $token = $authResponse.access_token
    Write-Host "✅ Authentication successful" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,40))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Authentication failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create Test Event
Write-Host "`n📝 Step 2: Creating test event..." -ForegroundColor Yellow

$eventHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$eventBody = @{
    event_data = @{
        question = "Will Plokymarket reach 10000 registered users by June 30, 2026?"
        description = "Test event to verify the complete event creation and trading system is working end-to-end. This includes market creation, order matching, and real-time price updates."
        category = "technology"
        subcategory = "Platform Metrics"
        tags = @("plokymarket", "growth", "platform", "test")
        trading_closes_at = "2026-06-30T23:59:59Z"
        resolution_delay_hours = 24
        initial_liquidity = 10000
        image_url = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400"
        answer1 = "হ্যাঁ (YES)"
        answer2 = "না (NO)"
        is_featured = $true
        slug = "plokymarket-10k-users-june-2026"
    }
    resolution_config = @{
        primary_method = "ai_oracle"
        ai_keywords = @("plokymarket", "users", "platform", "registered")
        ai_sources = @("plokymarket.com")
        confidence_threshold = 85
    }
} | ConvertTo-Json -Depth 10

try {
    $eventResponse = Invoke-WebRequest -Uri "https://polymarket-bangladesh.vercel.app/api/admin/events/create" -Method POST -Headers $eventHeaders -Body $eventBody -UseBasicParsing
    
    if ($eventResponse.StatusCode -eq 200) {
        Write-Host "✅ Event created successfully" -ForegroundColor Green
        
        $responseData = $eventResponse.Content | ConvertFrom-Json
        Write-Host "`n📊 Event Details:" -ForegroundColor Cyan
        Write-Host "   Event ID: $($responseData.event_id)" -ForegroundColor Green
        Write-Host "   Status: $($responseData.message)" -ForegroundColor Green
        Write-Host "   Execution Time: $($responseData.execution_time_ms)ms" -ForegroundColor Gray
        
        # Step 3: Verify Event on Frontend
        Write-Host "`n🔗 View Test Event:" -ForegroundColor Yellow
        Write-Host "   Live: https://polymarket-bangladesh.vercel.app" -ForegroundColor Cyan
        Write-Host "   Admin: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Event creation returned status $($eventResponse.StatusCode)" -ForegroundColor Yellow
        Write-Host "Response: $($eventResponse.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Event creation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Test event creation complete!" -ForegroundColor Green
