// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  console.log('🔍 Checking actual table structure in database...\n');

  try {
    // Query the information_schema to get actual column information
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'roads'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.log('⚠️  Cannot query information_schema directly (this is normal)');
      console.log('Trying alternative method...\n');

      // Try to get table structure by attempting a select
      const { data: selectData, error: selectError } = await supabase
        .from('roads')
        .select('*')
        .limit(0);

      if (selectError) {
        console.error('❌ Error:', selectError.message);
        console.log('\n📋 Please verify in Supabase Dashboard:');
        console.log('1. Go to: https://app.supabase.com/project/isqmtnwwwtzhzgupxlzc/editor');
        console.log('2. Check if "roads" table exists');
        console.log('3. Verify it has these columns: id, name, condition, description, latitude, longitude, created_at');
        console.log('\nIf the table is missing or has wrong columns:');
        console.log('1. Go to: https://app.supabase.com/project/isqmtnwwwtzhzgupxlzc/sql');
        console.log('2. Run: DROP TABLE IF EXISTS roads CASCADE;');
        console.log('3. Then run the SQL from supabase-setup.sql\n');
      } else {
        console.log('✅ Table accessible, but empty');
        console.log('Schema cache might need refresh\n');

        // Try a raw insert without type checking
        console.log('🧪 Attempting direct insert...');
        const insertResult = await supabase
          .from('roads')
          .insert({
            name: 'Test Road',
            condition: 'good',
            description: 'Test',
            latitude: 35.6762,
            longitude: 139.6503
          } as any)
          .select();

        if (insertResult.error) {
          console.error('❌ Insert failed:', insertResult.error.message);
          console.error('Error code:', insertResult.error.code);
          console.error('Error details:', insertResult.error.details);
        } else {
          console.log('✅ Insert successful!', insertResult.data);

          // Clean up
          if (insertResult.data && insertResult.data[0]) {
            await supabase.from('roads').delete().eq('id', insertResult.data[0].id);
            console.log('✅ Test data cleaned up');
          }
        }
      }
    } else {
      console.log('Table structure:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTableStructure();
