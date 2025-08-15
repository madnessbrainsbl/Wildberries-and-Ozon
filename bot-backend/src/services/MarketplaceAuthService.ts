import { supabase } from '../utils/supabase';

export interface MarketplaceAuthRequest {
  user_id: string;
  marketplace: 'wildberries' | 'ozon';
  phone?: string;
  email?: string;
  api_key?: string;
  client_id?: string;
}

export interface MarketplaceAuthResponse {
  success: boolean;
  error?: string;
  requires_code?: boolean;
}

export class MarketplaceAuthService {
  /**
   * Инициализирует процесс авторизации для маркетплейса
   */
  static async initializeAuth(request: MarketplaceAuthRequest): Promise<MarketplaceAuthResponse> {
    try {
      let authError: any = null;
      if (request.phone) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: request.phone,
          options: { channel: 'sms' }
        });
        authError = error;
      } else if (request.email) {
        const { error } = await supabase.auth.signInWithOtp({
          email: request.email,
          options: { emailRedirectTo: undefined }
        });
        authError = error;
      } else {
        return { success: false, error: 'Phone or email required' };
      }

      if (authError) {
        console.error('Error sending OTP:', authError);
        return { success: false, error: authError.message };
      }

      // OTP отправлен – нужен код
      return { success: true, requires_code: true };
    } catch (error) {
      console.error('Unexpected error in initializeAuth:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Подтверждает код авторизации
   */
  static async confirmCode(identifier: string, code: string): Promise<MarketplaceAuthResponse> {
    try {
      // Определяем тип OTP (sms/email)
      const type = identifier.includes('@') ? 'email' : 'sms';

      const payload: any = {
        type: type as any,
        token: code
      };
      if (type === 'sms') payload.phone = identifier;
      else payload.email = identifier;

      const { error } = await supabase.auth.verifyOtp(payload);

      if (error) {
        console.error('Error confirming code:', error);
        return { success: false, error: error.message || 'Failed to confirm code' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in confirmCode:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Проверяет статус авторизации
   */
  static async checkAuthStatus(user_id: string, marketplace: 'wildberries' | 'ozon'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, settings')
        .eq('owner_id', user_id)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  /**
   * Сохраняет API ключи для маркетплейса
   */
  static async saveApiCredentials(
    user_id: string, 
    marketplace: 'wildberries' | 'ozon',
    credentials: { api_key?: string; client_id?: string; phone?: string; email?: string }
  ): Promise<boolean> {
    try {
      const is_authenticated = true; // If we're saving credentials, we consider it authenticated

      // Find or create store for this user and marketplace
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user_id)
        .eq('status', 'active')
        .single();

      let error = null;
      if (!existingStore) {
        // Create a new store for this user
        const storeData = {
          name: `${marketplace} Store`,
          description: `Automated store for ${marketplace}`,
          owner_id: user_id,
          status: 'active',
          telegram_bot_token: process.env.BOT_TOKEN || 'dummy_token_for_marketplace_integration',
          wildberries_token: marketplace === 'wildberries' ? credentials.api_key || '' : '',
          ozon_api_key: marketplace === 'ozon' ? credentials.api_key || '' : '',
          ozon_client_id: marketplace === 'ozon' ? credentials.client_id || '' : '',
          settings: {
            marketplace,
            phone: credentials.phone || null,
            email: credentials.email || null,
            is_authenticated
          }
        };

        const result = await supabase
          .from('stores')
          .insert(storeData);
        error = result.error;
      } else {
        // Update existing store
        const updateData: any = {
          settings: {
            marketplace,
            phone: credentials.phone || null,
            email: credentials.email || null,
            is_authenticated
          }
        };
        
        if (marketplace === 'wildberries' && credentials.api_key) {
          updateData.wildberries_token = credentials.api_key;
        } else if (marketplace === 'ozon') {
          if (credentials.api_key) updateData.ozon_api_key = credentials.api_key;
          if (credentials.client_id) updateData.ozon_client_id = credentials.client_id;
        }

        const result = await supabase
          .from('stores')
          .update(updateData)
          .eq('id', existingStore.id);
        error = result.error;
      }

      if (error) {
        console.error('Error saving marketplace account:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error saving credentials:', error);
      return false;
    }
  }

  /**
   * Получает сохраненные API ключи
   */
  static async getApiCredentials(
    user_id: string, 
    marketplace: 'wildberries' | 'ozon'
  ): Promise<{ api_key?: string; client_id?: string } | null> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('wildberries_token, ozon_api_key, ozon_client_id')
        .eq('owner_id', user_id)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      if (marketplace === 'wildberries') {
        return {
          api_key: data.wildberries_token
        };
      } else {
        return {
          api_key: data.ozon_api_key,
          client_id: data.ozon_client_id
        };
      }
    } catch (error) {
      console.error('Error getting API credentials:', error);
      return null;
    }
  }
}
