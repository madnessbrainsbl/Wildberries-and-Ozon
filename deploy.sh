#!/bin/bash

# Deployment script for teleshop.su

echo "Starting deployment to teleshop.su..."

# Server details
SERVER_IP="teleshop.su"
SERVER_USER="root"
PROJECT_PATH="/opt/teleshop"

# Create project directory on server
echo "Creating project directory..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_PATH"

# Copy project files to server
echo "Copying project files..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' \
  ./ $SERVER_USER@$SERVER_IP:$PROJECT_PATH/

# Copy environment file
echo "Setting up environment..."
scp .env $SERVER_USER@$SERVER_IP:$PROJECT_PATH/.env

# Connect to server and deploy
echo "Connecting to server for deployment..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /opt/teleshop

# Create database directory if not exists
mkdir -p database

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start new containers
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Check container status
echo "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "Deployment completed!"
ENDSSH

echo "Deployment script finished!"
