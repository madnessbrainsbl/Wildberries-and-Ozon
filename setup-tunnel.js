import localtunnel from 'localtunnel';

async function setupTunnel() {
  try {
    const tunnel = await localtunnel({ 
      port: 5173,
      subdomain: 'marketplace-bot-' + Math.random().toString(36).substring(7)
    });

    console.log('Tunnel URL:', tunnel.url);
    
    // Keep the tunnel alive
    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

    return tunnel.url;
  } catch (error) {
    console.error('Error setting up tunnel:', error);
  }
}

setupTunnel();
