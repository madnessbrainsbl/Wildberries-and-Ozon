# Tunnel Setup Instructions

Since ngrok blocks connections from your IP address, here are alternative solutions:

## Option 1: Use bore.pub (Recommended)

1. Run the PowerShell script:
   ```powershell
   .\start-tunnel.ps1
   ```

2. The script will download bore and create a tunnel. Note the URL it provides (e.g., https://bore.pub:12345)

3. Update the MINIAPP_URL in docker-compose.yml:
   ```yaml
   MINIAPP_URL: https://bore.pub:12345  # Replace with your actual URL
   ```

4. Restart the bot backend:
   ```powershell
   docker-compose restart bot-backend
   ```

## Option 2: Use Cloudflare Tunnel (More stable)

1. Install cloudflared:
   ```powershell
   winget install Cloudflare.cloudflared
   ```

2. Run tunnel:
   ```powershell
   cloudflared tunnel --url http://localhost:5173
   ```

3. Use the provided URL to update MINIAPP_URL

## Option 3: Use PageKite

1. Sign up at https://pagekite.net (free tier available)

2. Download and run:
   ```powershell
   curl -O https://pagekite.net/pk/pagekite.py
   python pagekite.py 5173 yourname.pagekite.me
   ```

## Option 4: Deploy to a free hosting service

For production testing, you can deploy the frontend to:
- Vercel: https://vercel.com
- Netlify: https://netlify.com
- GitHub Pages: https://pages.github.com

## Current Status

Your services are running:
- Frontend: http://localhost:5173
- Bot Backend: http://localhost:3002

You just need to expose the frontend URL to the internet and update the MINIAPP_URL environment variable.
