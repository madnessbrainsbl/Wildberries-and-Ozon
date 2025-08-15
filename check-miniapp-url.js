import { readFileSync } from 'fs';

console.log('Checking miniapp URL configuration...\n');

// Check BotController.ts
const botController = readFileSync('./bot-backend/src/controllers/BotController.ts', 'utf-8');
const urlMatch = botController.match(/const miniAppUrl = '(.+)';/);
if (urlMatch) {
  console.log('✅ BotController.ts URL:', urlMatch[1]);
} else {
  console.log('❌ Could not find miniapp URL in BotController.ts');
}

// Check docker-compose.yml
const dockerCompose = readFileSync('./docker-compose.yml', 'utf-8');
const envMatch = dockerCompose.match(/MINIAPP_URL=(.+)/);
if (envMatch) {
  console.log('✅ docker-compose.yml URL:', envMatch[1]);
} else {
  console.log('❌ Could not find MINIAPP_URL in docker-compose.yml');
}

console.log('\n✨ Expected URL: https://teleshop.su/miniapp/5358ebd1-d90b-4c55-a0ff-f8840f8da283');
