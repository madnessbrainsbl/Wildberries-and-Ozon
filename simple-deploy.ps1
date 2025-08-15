$ErrorActionPreference = "Continue"

Write-Host "Creating project archive..." -ForegroundColor Green
tar -czf project.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='bore.exe' .

Write-Host "Archive created. Now you need to:" -ForegroundColor Yellow
Write-Host "1. Open Windows Terminal or Command Prompt"
Write-Host "2. Run: scp project.tar.gz root@82.146.40.171:/opt/teleshop/" 
Write-Host "3. When prompted, enter password: Alfa2000@"
Write-Host ""
Write-Host "Then connect to server and run setup:" -ForegroundColor Yellow
Write-Host "ssh root@82.146.40.171"
Write-Host "cd /opt/teleshop && tar -xzf project.tar.gz"
Write-Host "docker compose -f docker-compose.prod.yml up -d"
