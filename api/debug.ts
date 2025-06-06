import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verificar se as tabelas existem
    let databaseInfo = null;
    try {
      const tablesResult = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tables = tablesResult.rows.map(row => row.table_name);

      // Verificar contagem de registros para tabelas importantes
      const tableCounts: Record<string, number> = {};

      for (const tableName of ['users', 'addresses', 'categories', 'products', 'orders', 'cart_items']) {
        if (tables.includes(tableName)) {
          try {
            const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${tableName}"`));
            tableCounts[tableName] = parseInt(countResult.rows[0]?.count || '0');
          } catch (error) {
            tableCounts[tableName] = -1; // Erro ao contar
          }
        } else {
          tableCounts[tableName] = -2; // Tabela não existe
        }
      }

      databaseInfo = {
        connected: true,
        tables: tables,
        tableCounts: tableCounts,
        totalTables: tables.length
      };
    } catch (dbError) {
      databaseInfo = {
        connected: false,
        error: dbError.message
      };
    }

    // Debug information
    const debugInfo = {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
        SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
      },
      database: databaseInfo,
      headers: req.headers,
      query: req.query,
      body: req.body
    };

    console.log('Debug API called:', debugInfo);

    res.status(200).json({
      message: 'Debug endpoint working',
      ...debugInfo
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);

    res.status(500).json({
      message: 'Debug endpoint error',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      }
    });
  }
}
