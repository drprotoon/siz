/**
 * Configurações específicas para produção
 * Este arquivo contém configurações que são aplicadas apenas em ambiente de produção
 */

export const productionConfig = {
  // Configuração de sessão para produção
  session: {
    cookie: {
      secure: true, // Sempre usar HTTPS em produção
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: 'none' as const, // Necessário para cross-origin requests
      domain: process.env.COOKIE_DOMAIN || undefined // Permite configurar o domínio do cookie
    },
    secret: process.env.SESSION_SECRET || "beauty-essence-secret-prod",
    resave: false,
    saveUninitialized: false
  },

  // Configuração de banco de dados para produção
  database: {
    ssl: {
      rejectUnauthorized: false // Necessário para alguns provedores de banco
    },
    connectionString: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    }
  },

  // Configuração de CORS para produção
  cors: {
    origin: [
      'https://siz-cosmetic-store-pro.vercel.app',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Rate limiting mais restritivo em produção
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // Máximo 5 tentativas por IP
      message: 'Muitas tentativas de login, tente novamente em 15 minutos'
    },
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Máximo 100 requests por IP
      message: 'Muitas requisições, tente novamente em 15 minutos'
    }
  },

  // Headers de segurança para produção
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://vercel.live"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'", 
          "https://api.frenet.com.br", 
          "https://*.supabase.co", 
          "wss://*.supabase.co",
          "https://api.abacatepay.com"
        ],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }
};

/**
 * Função para validar se todas as variáveis de ambiente necessárias estão configuradas
 */
export function validateProductionConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Função para logar a configuração de produção (sem expor dados sensíveis)
 */
export function logProductionConfig() {
  console.log('🚀 Production configuration loaded:');
  console.log(`  - Environment: ${process.env.NODE_ENV}`);
  console.log(`  - Vercel deployment: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);
  console.log(`  - Database SSL: ${productionConfig.database.ssl ? 'Enabled' : 'Disabled'}`);
  console.log(`  - Secure cookies: ${productionConfig.session.cookie.secure ? 'Enabled' : 'Disabled'}`);
  console.log(`  - CORS origins: ${productionConfig.cors.origin.length} configured`);
  
  const validation = validateProductionConfig();
  if (!validation.isValid) {
    console.warn('⚠️  Missing required environment variables:', validation.missingVars);
  } else {
    console.log('✅ All required environment variables are configured');
  }
}
