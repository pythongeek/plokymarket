@echo off
REM Plokymarket Database & Deployment Script for Windows
REM This script applies database fixes to Supabase and deploys to Vercel

setlocal enabledelayedexpansion

echo ====================================
echo Starting Plokymarket Database Fix
echo ====================================
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

REM Check if .env.local exists
if not exist "%SCRIPT_DIR%.env.local" (
    echo [WARNING] .env.local not found. Creating from template...
    copy "%SCRIPT_DIR%.env.example" "%SCRIPT_DIR%.env.local" >nul
    echo [ERROR] Please edit .env.local with your Supabase credentials!
    echo.
    echo Your .env.local has been created. Please add your credentials:
    echo   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    echo   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    echo   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
    echo.
    pause
    exit /b 1
)

REM Load environment variables (simple parsing)
for /f "tokens=1,2 delims==" %%a in ('type "%SCRIPT_DIR%.env.local" ^| findstr /v "^#"') do (
    set "%%a=%%b"
)

REM Check if credentials are set
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo [ERROR] Please update .env.local with your actual Supabase credentials!
    pause
    exit /b 1
)

REM Extract Supabase project reference
for /f "tokens=2 delims=/" %%a in ("%NEXT_PUBLIC_SUPABASE_URL%") do set "SUPABASE_REF=%%a"
for /f "tokens=1 delims=." %%a in ("%SUPABASE_REF%") do set "SUPABASE_REF=%%a"

echo.
echo [INFO] Database Configuration:
echo   Supabase URL: %NEXT_PUBLIC_SUPABASE_URL%
echo   Project Ref: %SUPABASE_REF%
echo.

REM Step 1: Apply database schema
echo ====================================
echo Step 1: Applying Database Schema
echo ====================================
echo.
echo [INFO] Please manually apply the database schema in Supabase SQL Editor:
echo   https://supabase.com/dashboard/project/%SUPABASE_REF%/sql
echo.
echo SQL File: %PROJECT_ROOT%\supabase\db\init.sql
echo.
echo Press any key to open the SQL file and continue...
pause >nul
start "" "%PROJECT_ROOT%\supabase\db\init.sql"

echo.
echo [INFO] After applying the SQL, press any key to continue...
pause >nul

REM Step 2: Apply matching engine functions
echo.
echo ====================================
echo Step 2: Applying Matching Engine Functions
echo ====================================
echo.
echo [INFO] Please manually apply the matching engine functions in Supabase SQL Editor:
echo   https://supabase.com/dashboard/project/%SUPABASE_REF%/sql
echo.
echo SQL File: %PROJECT_ROOT%\supabase\db\matching_engine.sql
echo.
echo Press any key to open the SQL file and continue...
pause >nul
start "" "%PROJECT_ROOT%\supabase\db\matching_engine.sql"

echo.
echo [INFO] After applying the SQL, press any key to continue...
pause >nul

REM Step 3: Build the application
echo.
echo ====================================
echo Step 3: Building Application
echo ====================================
echo.
cd /d "%SCRIPT_DIR%"
echo [INFO] Installing dependencies...
call npm ci

echo.
echo [INFO] Building application...
call npm run build

echo.
echo [SUCCESS] Build successful!
echo.

REM Step 4: Deploy to Vercel
echo ====================================
echo Step 4: Deploying to Vercel
echo ====================================
echo.

where vercel >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Deploying to Vercel...
    call vercel --prod
) else (
    echo [WARNING] Vercel CLI not found. Options:
    echo.
    echo 1. Install Vercel CLI:
    echo    npm i -g vercel
    echo.
    echo 2. Or deploy via GitHub:
    echo    cd %PROJECT_ROOT%
    echo    git add .
    echo    git commit -m "Deploy database fix"
    echo    git push
    echo.
    echo 3. Or manually deploy from Vercel dashboard:
    echo    - Go to vercel.com
    echo    - Import your GitHub repository
    echo    - Add environment variables
    echo    - Deploy!
)

echo.
echo ====================================
echo Database Fix & Deployment Complete!
echo ====================================
echo.
echo [INFO] Next Steps:
echo   1. Verify database tables in Supabase Dashboard
echo   2. Test the application at your Vercel URL
echo   3. Check that matching engine functions are working
echo.
echo [INFO] Useful Links:
echo   - Supabase Dashboard: https://supabase.com/dashboard/project/%SUPABASE_REF%
echo   - SQL Editor: https://supabase.com/dashboard/project/%SUPABASE_REF%/sql
echo   - Table Editor: https://supabase.com/dashboard/project/%SUPABASE_REF%/editor
echo.

pause
