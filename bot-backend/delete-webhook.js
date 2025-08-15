const https = require('https');

const TOKEN = '8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0';

// Delete webhook
const deleteWebhook = () => {
  const url = `https://api.telegram.org/bot${TOKEN}/deleteWebhook`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Delete webhook response:', JSON.parse(data));
    });
  }).on('error', (err) => {
    console.error('Error:', err);
  });
};

// Get webhook info
const getWebhookInfo = () => {
  const url = `https://api.telegram.org/bot${TOKEN}/getWebhookInfo`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Webhook info:', JSON.parse(data));
    });
  }).on('error', (err) => {
    console.error('Error:', err);
  });
};

console.log('Checking webhook status...');
getWebhookInfo();

setTimeout(() => {
  console.log('\nDeleting webhook...');
  deleteWebhook();
  
  setTimeout(() => {
    console.log('\nChecking webhook status again...');
    getWebhookInfo();
  }, 2000);
}, 2000);
