@echo off
echo Starting deployment to teleshop.su...

REM Copy environment file
copy .env.production .env

REM Use WSL to run the deploy script if available
where wsl >nul 2>nul
if %ERRORLEVEL% == 0 (
    echo Using WSL to deploy...
    wsl bash deploy.sh
) else (
    echo WSL not found. Please use Git Bash or install WSL to deploy.
    echo Or manually copy files to server and run:
    echo ssh root@teleshop.su "cd /opt/teleshop && docker-compose -f docker-compose.prod.yml up --build -d"
    pause
)

echo Deployment completed!
