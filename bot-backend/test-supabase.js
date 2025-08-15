const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('\n1. Testing basic connection...');
    const { data: test, error: testError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Connection test failed:', testError);
    } else {
      console.log('Connection successful!');
    }

    // Test 2: Try to select from users table
    console.log('\n2. Trying to select from users table...');
    const { data: users, error: usersError, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (usersError) {
      console.error('Users query error:', usersError);
    } else {
      console.log(`Found ${count} users in total`);
      console.log('Sample users:', users);
    }

    // Test 3: Check table existence with raw SQL
    console.log('\n3. Checking tables with SQL...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables', {}, { get: true })
      .select('*');
    
    if (tablesError) {
      console.log('Cannot run custom RPC (this is normal)');
    }

    // Test 4: Try to create a test user
    console.log('\n4. Trying to create a test user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        telegram_id: 999999999,
        username: 'test_user',
        first_name: 'Test',
        last_name: 'User'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Create user error:', createError);
    } else {
      console.log('Created test user:', newUser);
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('telegram_id', 999999999);
      
      if (deleteError) {
        console.error('Failed to delete test user:', deleteError);
      } else {
        console.log('Test user cleaned up');
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
