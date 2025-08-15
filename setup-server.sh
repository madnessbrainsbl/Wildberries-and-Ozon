#!/bin/bash

# Initial server setup script for teleshop.su

echo "🚀 Starting initial server setup..."

# Server details
SERVER_IP="teleshop.su"
SERVER_USER="root"

echo "📦 Connecting to server for initial setup..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    
    echo "📦 Updating system packages..."
    apt-get update && apt-get upgrade -y
    
    echo "🔧 Installing required packages..."
    apt-get install -y \
        curl \
        git \
        vim \
        htop \
        certbot \
        python3-certbot-nginx \
        rsync
    
    echo "🔒 Setting up firewall..."
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3002/tcp
    ufw --force enable
    
    echo "📁 Creating required directories..."
    mkdir -p /opt/teleshop
    mkdir -p /var/www/certbot
    
    echo "🔐 Obtaining SSL certificate..."
    # Stop any service on port 80 first
    systemctl stop nginx 2>/dev/null || true
    docker stop $(docker ps -q) 2>/dev/null || true
    
    # Get certificate
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@teleshop.su \
        -d teleshop.su \
        -d www.teleshop.su
    
    echo "✅ Initial server setup completed!"
ENDSSH

echo "✅ Server setup script finished!"
echo "📌 Now you can run ./deploy.sh to deploy the application"
