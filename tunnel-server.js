import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import localtunnel from 'localtunnel';

const app = express();
const PORT = 3003;

// Proxy all requests to the frontend
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5173',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}));

async function startTunnel() {
  try {
    // Start the proxy server
    const server = app.listen(PORT, () => {
      console.log(`Proxy server running on port ${PORT}`);
    });

    // Create tunnel
    const tunnel = await localtunnel({ 
      port: PORT,
      subdomain: 'tgbot-shop-' + Date.now()
    });

    console.log('🌐 Tunnel URL:', tunnel.url);
    console.log('📱 Use this URL in your Telegram bot');
    
    // Keep updating the bot with the URL
    console.log('\nTo update bot with this URL, run:');
    console.log(`$env:MINIAPP_URL='${tunnel.url}'; docker-compose restart bot-backend`);

    // Keep the tunnel alive
    tunnel.on('close', () => {
      console.log('Tunnel closed');
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\nClosing tunnel...');
      tunnel.close();
      server.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error setting up tunnel:', error);
  }
}

startTunnel();
