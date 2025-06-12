import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Testing Supabase connection...');

    const tables = ['users', 'categories', 'products', 'orders', 'addresses', 'payments'];
    const results: any = {};

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        results[tableName] = {
          exists: !error,
          error: error?.message || null,
          columns: data && data.length > 0 ? Object.keys(data[0]) : [],
          sampleData: data?.[0] || null,
          count: data?.length || 0
        };
      } catch (tableError) {
        results[tableName] = {
          exists: false,
          error: tableError instanceof Error ? tableError.message : String(tableError),
          columns: [],
          sampleData: null,
          count: 0
        };
      }
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables: results
    });

  } catch (error) {
    console.error('Debug schema error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
