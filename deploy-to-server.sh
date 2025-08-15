#!/bin/bash

# Deployment script for teleshop.su server
# This script will:
# 1. Copy project files to server
# 2. Install dependencies
# 3. Build and run the application with Docker

set -e

# Server configuration
SERVER_USER="root"
SERVER_HOST="teleshop.su"
SERVER_PATH="/var/www/teleshop"
PROJECT_DIR="/d/project"

echo "🚀 Starting deployment to teleshop.su..."

# Create directory structure on server
echo "📁 Creating directory structure on server..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}"

# Copy project files to server
echo "📤 Copying project files to server..."
rsync -avz --exclude=node_modules --exclude=.git --exclude=dist ${PROJECT_DIR}/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

# Create production environment file
echo "🔧 Creating production environment file..."
ssh ${SERVER_USER}@${SERVER_HOST} "cat > ${SERVER_PATH}/.env.prod << 'EOF'
# Production Environment Variables
VITE_SUPABASE_URL=https://kzrafexlalajoirzugdj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk
TELEGRAM_BOT_TOKEN=8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0
EOF"

# Install Docker if not installed
echo "🐳 Checking Docker installation..."
ssh ${SERVER_USER}@${SERVER_HOST} "
if ! command -v docker &> /dev/null; then
    echo '📦 Installing Docker...'
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    curl -L \"https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
else
    echo '✅ Docker is already installed'
fi
"

# Stop existing containers
echo "🛑 Stopping existing containers..."
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_PATH} && docker-compose -f docker-compose.prod.yml down --remove-orphans || true"

# Build and start containers
echo "🏗️ Building and starting containers..."
ssh ${SERVER_USER}@${SERVER_HOST} "
cd ${SERVER_PATH}
export VITE_SUPABASE_URL=https://kzrafexlalajoirzugdj.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk
export TELEGRAM_BOT_TOKEN=8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0
docker-compose -f docker-compose.prod.yml up -d --build
"

# Set up Nginx reverse proxy
echo "🌐 Setting up Nginx reverse proxy..."
ssh ${SERVER_USER}@${SERVER_HOST} "
# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/teleshop.su << 'EOF'
server {
    listen 80;
    server_name teleshop.su www.teleshop.su;

    # Frontend (main site)
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Bot backend API
    location /api/ {
        proxy_pass http://localhost:3002/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket support for bot
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/teleshop.su /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
systemctl enable nginx
"

# Set up SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
ssh ${SERVER_USER}@${SERVER_HOST} "
# Install certbot
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
certbot --nginx -d teleshop.su -d www.teleshop.su --non-interactive --agree-tos --email admin@teleshop.su --redirect
"

# Check deployment status
echo "✅ Checking deployment status..."
ssh ${SERVER_USER}@${SERVER_HOST} "
cd ${SERVER_PATH}
echo '=== Container Status ==='
docker-compose -f docker-compose.prod.yml ps
echo
echo '=== Recent Logs ==='
docker-compose -f docker-compose.prod.yml logs --tail=20
echo
echo '=== Nginx Status ==='
systemctl status nginx --no-pager -l
"

echo "🎉 Deployment completed successfully!"
echo "🌐 Your application is now available at:"
echo "   • https://teleshop.su (Main site)"
echo "   • https://teleshop.su/api (Bot backend)"
echo ""
echo "📱 Telegram Bot is running and ready to receive messages!"
echo "💬 Users can start the bot by sending /start to @your_bot_username"

