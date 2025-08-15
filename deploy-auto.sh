#!/bin/bash

SERVER_IP="82.146.40.171"
SERVER_USER="root"
SERVER_PASSWORD="Alfa2000@"
PROJECT_DIR="/opt/teleshop"

echo "🚀 Starting deployment to VPS server..."

# Function to execute SSH commands with password
ssh_exec() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files with password
scp_copy() {
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r $1 $SERVER_USER@$SERVER_IP:$2
}

echo "📦 Installing required packages on server..."
ssh_exec "apt-get update && apt-get upgrade -y"

echo "📦 Installing Docker..."
ssh_exec "apt-get install -y ca-certificates curl gnupg lsb-release"
ssh_exec "mkdir -p /etc/apt/keyrings"
ssh_exec "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg"
ssh_exec "echo 'deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable' | tee /etc/apt/sources.list.d/docker.list > /dev/null"
ssh_exec "apt-get update"
ssh_exec "apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"

echo "📦 Installing Node.js..."
ssh_exec "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
ssh_exec "apt-get install -y nodejs"

echo "📦 Installing Chrome for Puppeteer..."
ssh_exec "wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -"
ssh_exec "echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list.d/google.list"
ssh_exec "apt-get update"
ssh_exec "apt-get install -y google-chrome-stable"

echo "📁 Creating project directory..."
ssh_exec "mkdir -p $PROJECT_DIR"

echo "📤 Copying project files..."
# Create archive locally
tar -czf /tmp/project.tar.gz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='bore.exe' .

# Copy archive to server
scp_copy "/tmp/project.tar.gz" "$PROJECT_DIR/"

# Extract on server
ssh_exec "cd $PROJECT_DIR && tar -xzf project.tar.gz && rm project.tar.gz"

echo "🔧 Creating production environment file..."
ssh_exec "cat > $PROJECT_DIR/.env.production << 'EOF'
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
MINIAPP_URL=https://teleshop.su
HEADLESS_BROWSER=false
EOF"

echo "🌐 Setting up Nginx..."
ssh_exec "cat > /etc/nginx/sites-available/teleshop << 'EOF'
server {
    listen 80;
    server_name teleshop.su;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"

ssh_exec "ln -sf /etc/nginx/sites-available/teleshop /etc/nginx/sites-enabled/"
ssh_exec "rm -f /etc/nginx/sites-enabled/default"
ssh_exec "nginx -t && systemctl restart nginx"

echo "🐳 Building and starting services..."
ssh_exec "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml down"
ssh_exec "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml build --no-cache"
ssh_exec "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml up -d"

echo "✅ Deployment complete!"
echo "🌐 Your application is now available at: https://teleshop.su"
