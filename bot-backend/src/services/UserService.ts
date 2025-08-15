import { supabaseAdmin } from '../utils/supabase';
import TelegramBot from 'node-telegram-bot-api';

export class UserService {
  /**
   * Generate consistent user ID from Telegram ID
   * Since we don't have users table, we use telegram ID as the primary identifier
   */
  static async ensureUser(telegramId: number, from: TelegramBot.User): Promise<string> {
    // Authenticates via Telegram without creating a database user
    console.log(`User ${telegramId} (${from.username || from.first_name}) authenticated via Telegram`);
    return telegramId.toString();
  }
  
  /**
   * Get user ID by Telegram ID
   * Returns a consistent ID based on telegram ID
   */
  static async getUserIdByTelegramId(telegramId: number): Promise<string | null> {
    // Always return telegram ID as string for consistency
    return telegramId.toString();
  }
}
