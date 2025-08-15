const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Creating database tables...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') || 
          statement.includes('ALTER TABLE') ||
          statement.includes('CREATE POLICY')) {
        
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        try {
          // Note: Supabase doesn't support direct SQL execution through the JS client
          // We need to use the SQL editor in Supabase dashboard or use migrations
          console.log('⚠️  Please execute the following SQL in Supabase SQL Editor:');
          console.log('---');
          console.log(statement + ';');
          console.log('---');
        } catch (error) {
          console.error(`Error executing statement: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ SQL statements generated. Please execute them in Supabase SQL Editor.');
    console.log('\nTo do this:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the schema.sql content');
    console.log('5. Click "Run"');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test connection first
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('❌ Table "users" does not exist. Need to create tables.');
      return false;
    } else if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('✅ Connection successful, tables already exist.');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

async function main() {
  const tablesExist = await testConnection();
  
  if (!tablesExist) {
    await createTables();
  } else {
    console.log('Tables already exist, skipping creation.');
  }
}

main();
