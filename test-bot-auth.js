const axios = require('axios');

async function testBotAuth() {
  try {
    console.log('Testing bot authentication endpoint...');
    
    // Test the bot's health endpoint
    const healthResponse = await axios.get('http://localhost:3002/health');
    console.log('Health check:', healthResponse.data);
    
    // Test if the bot is responding
    const botInfo = await axios.get('http://localhost:3002/api/bot-info');
    console.log('Bot info:', botInfo.data);
    
  } catch (error) {
    console.error('Error testing bot:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testBotAuth();
