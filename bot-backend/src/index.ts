import dotenv from 'dotenv';
import express from 'express';
import { BotController } from './controllers/BotController';
import path from 'path';
import authRoutes from './routes/api/auth.routes';
import storesRoutes from './routes/api/stores.routes';
import productsRoutes from './routes/api/products.routes';

// Load environment variables
dotenv.config();

// Initialize Express server
const app = express();
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../dist')));

// Initialize Telegram bot
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables!');
  process.exit(1);
}

console.log('🤖 Initializing Telegram bot...');
const bot = new BotController(botToken);
console.log('✅ Telegram bot is active and listening for messages');
console.log('💬 Send /start to your bot to begin!');

// Start Express server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log(`📱 Mini App available at http://localhost:${PORT}`);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});
