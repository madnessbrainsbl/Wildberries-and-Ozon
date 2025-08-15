const { execSync } = require('child_process');
const https = require('https');

const BOT_TOKEN = '8473502537:AAG1NAD5ryNZlx-FnEGGX9jlwqli7Zpq9Y0';

async function getPublicUrl() {
  console.log('🌐 Getting public URL...');
  
  // Try to use serveo.net (no signup required)
  try {
    console.log('Trying serveo.net...');
    // Start SSH tunnel in background
    execSync('start /b ssh -o StrictHostKeyChecking=no -R 80:localhost:3002 serveo.net', { 
      shell: 'cmd.exe',
      stdio: 'ignore' 
    });
    
    // Wait a bit for tunnel to establish
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // For serveo, the URL format is predictable
    const url = 'https://localhost.serveo.net';
    console.log(`✅ Public URL: ${url}`);
    return url;
  } catch (error) {
    console.error('❌ Failed to create serveo tunnel:', error.message);
  }
  
  return null;
}

async function setWebhook(url) {
  const webhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${url}/webhook`;
  
  return new Promise((resolve, reject) => {
    https.get(webhookUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.ok) {
          console.log('✅ Webhook set successfully!');
          resolve(result);
        } else {
          console.error('❌ Failed to set webhook:', result);
          reject(result);
        }
      });
    }).on('error', reject);
  });
}

async function deleteWebhook() {
  const deleteUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
  
  return new Promise((resolve, reject) => {
    https.get(deleteUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        console.log('🗑️ Webhook deleted:', result);
        resolve(result);
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    // First delete any existing webhook
    await deleteWebhook();
    
    // Get public URL
    const publicUrl = await getPublicUrl();
    
    if (publicUrl) {
      // Set webhook
      await setWebhook(publicUrl);
      console.log(`
✅ Bot is ready!
📱 Open Telegram and send /start to your bot
🌐 Public URL: ${publicUrl}
⚠️  Keep this script running to maintain the tunnel
      `);
      
      // Keep the script running
      process.stdin.resume();
    } else {
      console.error('❌ Could not establish public URL');
      console.log(`
ℹ️ For local testing, the bot is using polling mode.
📱 You can still interact with the bot via Telegram.
⚠️ Mini apps will only work with a public URL.
      `);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Cleaning up...');
  await deleteWebhook();
  process.exit(0);
});

main();
