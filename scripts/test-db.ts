// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../.env.local') });

// Create Supabase client after loading env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  console.log('🔍 Testing Supabase connection...\n');
  console.log('Supabase URL:', supabaseUrl.substring(0, 30) + '...');

  // Test 1: Check connection and table structure
  try {
    // First, try to select all columns to see what exists
    const { data, error } = await supabase.from('roads').select('*').limit(1);

    if (error) {
      console.error('❌ Table access failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);

      if (error.code === '42P01') {
        console.log('\n📋 The "roads" table does not exist in your database.');
        console.log('Please run the SQL script in Supabase:\n');
        console.log('1. Go to https://app.supabase.com/project/isqmtnwwwtzhzgupxlzc/sql');
        console.log('2. Copy and paste the content from supabase-setup.sql');
        console.log('3. Click "Run" to create the table\n');
      } else {
        console.log('\n⚠️  The table exists but there might be a schema issue.');
        console.log('Please verify the table structure in Supabase:\n');
        console.log('1. Go to https://app.supabase.com/project/isqmtnwwwtzhzgupxlzc/editor');
        console.log('2. Check if the "roads" table has all required columns');
        console.log('3. You may need to drop and recreate the table using supabase-setup.sql\n');
      }

      return;
    }

    console.log('✅ Connection successful!');
    if (data && data.length > 0) {
      console.log('Table structure (first row):', Object.keys(data[0]));
    } else {
      console.log('Table is empty, checking count...');
      const { data: countData } = await supabase.from('roads').select('count');
      console.log('Current roads count:', countData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  // Test 2: Try to insert a test record
  console.log('\n🧪 Testing insert operation...');
  try {
    const { data, error } = await supabase
      .from('roads')
      .insert([
        {
          name: 'Test Road',
          condition: 'good',
          description: 'This is a test record',
          latitude: 35.6762,
          longitude: 139.6503,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Insert test failed:');
      console.error('Error:', error.message);
      return;
    }

    console.log('✅ Insert successful!');
    console.log('Created record:', data);

    // Clean up test record
    if (data) {
      await supabase.from('roads').delete().eq('id', data.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (error) {
    console.error('❌ Unexpected error during insert:', error);
  }
}

testDatabase();
