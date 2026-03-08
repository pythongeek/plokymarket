<#
.SYNOPSIS
Post-Migration Cleanup Archiver

.DESCRIPTION
This script is designed to run after the structured Domain Phase Modules (001 - 100) 
have successfully been operating in production for 2 weeks. It relocates all legacy 
migration files into a structured archive directory.

.NOTES
As requested by the DB Migration Plan (Step 11).
#>

$MigrationDir = "$PSScriptRoot\..\supabase\migrations"
$ArchiveDir = "$MigrationDir\archive_legacy"

if (-not (Test-Path $ArchiveDir)) {
    New-Item -ItemType Directory -Path $ArchiveDir | Out-Null
    Write-Host "Created archive directory at $ArchiveDir" -ForegroundColor Green
}

# The canonical new schema files exist in the \new directory and will be 
# promoted to the main directory once applied sequentially in production.
# This script targets only the legacy files present before the rebuild.

Write-Host "Archiving legacy 001-999 migration files..." -ForegroundColor Cyan

# Gather all .sql files in the root of the migrations directory
$legacyFiles = Get-ChildItem -Path $MigrationDir -Filter "*.sql" -File

$moveCount = 0
foreach ($file in $legacyFiles) {
    # Move the file to the archive bucket safely
    Move-Item -Path $file.FullName -Destination $ArchiveDir -Force
    $moveCount++
}

Write-Host "Successfully archived $moveCount legacy migration files to /archive_legacy/!" -ForegroundColor Green
Write-Host "Please ensure the new Domain Modules from /new/ have been promoted to the root directory." -ForegroundColor Yellow
