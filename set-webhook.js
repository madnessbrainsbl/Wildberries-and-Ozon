const https = require('https');

const TELEGRAM_BOT_TOKEN = '8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0';
const WEBHOOK_URL = 'https://095b4b348ed82a.lhr.life/webhook';

const data = JSON.stringify({
  url: WEBHOOK_URL
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
