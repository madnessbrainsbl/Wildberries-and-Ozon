#!/bin/bash

# VPS Server deployment script
SERVER_IP="82.146.40.171"
SERVER_USER="root"
PROJECT_DIR="/opt/teleshop"

echo "🚀 Starting deployment to VPS server..."

# Update system packages
echo "📦 Updating system packages..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
apt-get update
apt-get upgrade -y
EOF

# Install required packages
echo "📦 Installing required packages..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
# Install Docker
apt-get install -y ca-certificates curl gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Git
apt-get install -y git

# Install Nginx
apt-get install -y nginx certbot python3-certbot-nginx

# Install Chrome for Puppeteer
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
apt-get update
apt-get install -y google-chrome-stable

# Install required libraries for Chrome
apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils
EOF

# Create project directory
echo "📁 Creating project directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_DIR"

# Copy project files
echo "📤 Copying project files..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.env.local' ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

# Create production environment file
echo "🔧 Creating production environment..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/teleshop
cat > .env.production << 'ENV'
# Bot Configuration
TELEGRAM_BOT_TOKEN=8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0

# Supabase Configuration
VITE_SUPABASE_URL=https://kzrafexlalajoirzugdj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketplace

# Server Configuration
NODE_ENV=production
MINIAPP_URL=https://teleshop.su/miniapp/5358ebd1-d90b-4c55-a0ff-f8840f8da283
HEADLESS_BROWSER=false
ENV
EOF

# Setup Nginx
echo "🌐 Setting up Nginx..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cat > /etc/nginx/sites-available/teleshop << 'NGINX'
server {
    listen 80;
    server_name teleshop.su;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Bot backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Mini app specific path
    location /miniapp {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/teleshop /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
EOF

# Build and start Docker containers
echo "🐳 Building and starting Docker containers..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /opt/teleshop
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
EOF

# Setup SSL certificate
echo "🔒 Setting up SSL certificate..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
certbot --nginx -d teleshop.su --non-interactive --agree-tos -m admin@teleshop.su
EOF

# Create systemd service for auto-restart
echo "🔧 Creating systemd service..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cat > /etc/systemd/system/teleshop.service << 'SERVICE'
[Unit]
Description=Teleshop Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/teleshop
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable teleshop.service
EOF

# Setup firewall
echo "🔥 Setting up firewall..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
EOF

echo "✅ Deployment complete!"
echo "🌐 Your application is now available at: https://teleshop.su"
echo "🤖 Telegram bot is running and ready to use"
