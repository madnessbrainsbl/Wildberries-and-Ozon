import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixUser() {
  const telegramId = 5433175523; // Your telegram ID from the logs
  
  console.log('Checking user with telegram_id:', telegramId);
  
  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user:', fetchError);
    return;
  }
  
  if (existingUser) {
    console.log('User found:', existingUser);
    
    // Check marketplace accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('marketplace_accounts')
      .select('*')
      .eq('user_id', existingUser.id);
    
    if (accountsError) {
      console.error('Error fetching marketplace accounts:', accountsError);
    } else {
      console.log('Marketplace accounts:', accounts);
    }
  } else {
    console.log('User not found. Creating new user...');
    
    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramId,
        username: 'ttest',
        first_name: 'Test',
        last_name: 'User'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating user:', createError);
    } else {
      console.log('User created successfully:', newUser);
    }
  }
}

// Run the check
checkAndFixUser().catch(console.error);
