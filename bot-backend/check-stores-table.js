const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

console.log('Using URL:', supabaseUrl);
console.log('Service key:', supabaseServiceKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStoresTable() {
  console.log('Checking stores table structure...\n');

  try {
    // Try to select from stores table
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying stores table:', error);
      
      if (error.code === 'PGRST204') {
        console.log('\nIt seems the table structure is different from expected.');
        console.log('The table might be missing the "email" column.');
        console.log('\nPlease check your Supabase Dashboard and ensure the stores table has these columns:');
        console.log('- id (uuid)');
        console.log('- user_id (uuid)');
        console.log('- marketplace (text)');
        console.log('- name (text)');
        console.log('- phone (text)');
        console.log('- email (text)');
        console.log('- is_active (boolean)');
        console.log('- created_at (timestamptz)');
        console.log('- updated_at (timestamptz)');
      }
    } else {
      console.log('✅ Successfully queried stores table');
      console.log('Sample data:', data);
    }

    // Check users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('\nError querying users table:', userError);
    } else {
      console.log('\n✅ Successfully queried users table');
      console.log('Sample user data:', userData);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkStoresTable();
