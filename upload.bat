@echo off
echo Installing OpenSSH Client...
powershell -Command "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"

echo.
echo Uploading project to server...
echo When prompted, enter password: Alfa2000@
echo.

scp project.tar.gz root@82.146.40.171:/opt/teleshop/

echo.
echo Now connecting to server...
echo When prompted, enter password: Alfa2000@
echo.

ssh root@82.146.40.171 "cd /opt/teleshop && tar -xzf project.tar.gz && docker compose -f docker-compose.prod.yml up -d"

echo.
echo Deployment complete!
pause
