@echo off
title GitHub Upload Helper
echo ==================================================
echo       AI Salon SaaS - GitHub Upload Helper
echo ==================================================
echo.
echo This script will upload your clean project files to GitHub.
echo.
set /p REPO_URL="1. Paste your GitHub Repository URL and press Enter: "

if "%REPO_URL%"=="" (
    echo.
    echo [Error] URL cannot be empty! Please run this script again.
    pause
    exit
)

echo.
echo 2. Initializing local Git repository...
git init

echo.
echo 3. Adding project files...
git add .

echo.
echo 4. Committing files...
git commit -m "feat: initial release v1.0"

echo.
echo 5. Setting main branch...
git branch -M main

echo.
echo 6. Linking to GitHub remote repository...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo 7. Uploading files to GitHub (please authorize if prompted)...
git push -u origin main --force

echo.
echo ==================================================
echo        UPLOAD COMPLETE!
echo ==================================================
echo Your code has been uploaded to GitHub.
echo.
echo Next steps:
echo 1. Go to Netlify.
echo 2. Connect this GitHub repository.
echo 3. Set the "Base directory" to: salon-saas
echo ==================================================
pause
exit
