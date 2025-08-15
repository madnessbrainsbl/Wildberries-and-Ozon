require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key present:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserCreation() {
  try {
    // Попробуем найти пользователя
    console.log('\nChecking if users table exists...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Users table error:', error.code, error.message);
    } else {
      console.log('Users table exists, sample data:', data);
    }

    // Проверим stores таблицу
    console.log('\nChecking stores table...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1);
    
    if (storesError) {
      console.log('Stores table error:', storesError);
    } else {
      console.log('Stores table exists, sample data:', stores);
    }

    // Попробуем создать пользователя через Auth
    console.log('\nChecking Supabase Auth...');
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        telegram_id: 5433175523,
        username: 'photo_videoart',
        first_name: 'Mark'
      }
    });

    if (authError) {
      console.log('Auth user creation error:', authError);
    } else {
      console.log('Auth user created successfully:', authData.user?.id);
      
      // Cleanup - delete test user
      if (authData.user?.id) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('Test user deleted');
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkUserCreation();
