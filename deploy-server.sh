#!/bin/bash
cd /opt/teleshop
mkdir -p /opt/teleshop
apt-get update -y
apt-get install -y docker-compose docker.io nginx
systemctl start docker
systemctl enable docker

# Extract project if archive exists
if [ -f project.tar.gz ]; then
    tar -xzf project.tar.gz
    rm project.tar.gz
fi

# Create production env
cat > .env.production << EOF
TELEGRAM_BOT_TOKEN=8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0
VITE_SUPABASE_URL=https://kzrafexlalajoirzugdj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmFmZXhsYWxham9pcnp1Z2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Mjk0MDMsImV4cCI6MjA2OTMwNTQwM30.rrKmafrLhQWNk7bIC5kfoO5pcvEkzO2i_THc5_Ep3nk
NODE_ENV=production
MINIAPP_URL=https://teleshop.su
HEADLESS_BROWSER=false
EOF

# Run docker
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

echo "Deployment complete!"
