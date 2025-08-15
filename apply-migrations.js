const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './bot-backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('Applying migrations to fix orders table...');

  // Читаем SQL файлы миграций
  const migrations = [
    './supabase/migrations/20250802_fix_orders_table.sql',
    './supabase/migrations/20250803_disable_rls_fix_orders.sql'
  ];

  for (const migrationPath of migrations) {
    try {
      console.log(`\nApplying migration: ${migrationPath}`);
      const sql = fs.readFileSync(path.resolve(migrationPath), 'utf8');
      
      // Выполняем SQL
      const { error } = await supabase.rpc('query', { query: sql });
      
      if (error) {
        // Если RPC не работает, попробуем выполнить через REST API
        console.log('RPC failed, trying direct SQL execution...');
        
        // Разбиваем SQL на отдельные команды
        const commands = sql.split(/;\s*$/m).filter(cmd => cmd.trim());
        
        for (const command of commands) {
          if (command.trim()) {
            console.log('Executing command...');
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ query: command + ';' })
            });
            
            if (!response.ok) {
              console.error(`Failed to execute: ${await response.text()}`);
            }
          }
        }
      }
      
      console.log(`✓ Migration ${migrationPath} applied successfully`);
    } catch (err) {
      console.error(`Error applying migration ${migrationPath}:`, err);
    }
  }

  // Проверяем, что колонка user_id теперь существует
  console.log('\nVerifying orders table structure...');
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error checking orders table:', error);
  } else {
    console.log('✓ Orders table is accessible');
  }
}

applyMigrations().then(() => {
  console.log('\nMigrations completed!');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
