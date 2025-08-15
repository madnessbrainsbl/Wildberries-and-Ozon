const axios = require('axios');

async function getNgrokUrl() {
  try {
    // Wait a bit for ngrok to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = response.data.tunnels;
    
    if (tunnels && tunnels.length > 0) {
      const httpsTunnel = tunnels.find(t => t.proto === 'https') || tunnels[0];
      console.log('Ngrok URL:', httpsTunnel.public_url);
      return httpsTunnel.public_url;
    }
  } catch (error) {
    console.error('Error getting ngrok URL:', error.message);
  }
}

getNgrokUrl();
