@echo off
echo ==========================================
echo Upstash QStash Schedule Setup
echo ==========================================
echo.

REM Set environment variables
set QSTASH_TOKEN=eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0=
set QSTASH_URL=https://qstash.upstash.io
set APP_URL=https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app

echo Creating QStash schedule...
echo Destination: %APP_URL%/api/cron/batch-markets
echo Schedule: Every 15 minutes
echo.

REM Use curl to create schedule
curl -X POST %QSTASH_URL%/v2/schedules ^
  -H "Authorization: Bearer %QSTASH_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"destination\":\"%APP_URL%/api/cron/batch-markets\",\"cron\":\"0,15,30,45 * * * *\",\"method\":\"GET\",\"retries\":3}"

echo.
echo.
echo If the above failed, please create manually at:
echo https://console.upstash.com/qstash/schedules
echo.
pause
