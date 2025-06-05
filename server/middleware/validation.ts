import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize input string to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input.trim());
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validation schemas for different endpoints
 */
export const validationSchemas = {
  // User registration
  register: z.object({
    username: z.string()
      .min(3, 'Username deve ter pelo menos 3 caracteres')
      .max(50, 'Username muito longo')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),

    email: z.string()
      .email('Email inválido')
      .max(255, 'Email muito longo'),

    password: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(100, 'Senha muito longa'),

    name: z.string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),

    phone: z.string()
      .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
      .optional(),

    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
      .optional()
  }),

  // User login
  login: z.object({
    username: z.string()
      .min(1, 'Username ou email é obrigatório'),

    password: z.string()
      .min(1, 'Senha é obrigatória')
  }),

  // Checkout form
  checkout: z.object({
    postalCode: z.string()
      .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
      .transform((cep: string) => cep.replace(/\D/g, '')),

    paymentMethod: z.enum(['credit', 'debit', 'pix'], {
      errorMap: () => ({ message: 'Método de pagamento inválido' })
    }),

    shippingOption: z.string()
      .min(1, 'Opção de frete é obrigatória'),

    recipientName: z.string()
      .min(2, 'Nome do destinatário deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo'),

    recipientAddress: z.string()
      .min(5, 'Endereço deve ter pelo menos 5 caracteres')
      .max(200, 'Endereço muito longo'),

    recipientNumber: z.string()
      .max(20, 'Número muito longo'),

    recipientComplement: z.string()
      .max(100, 'Complemento muito longo')
      .optional(),

    recipientDistrict: z.string()
      .min(2, 'Bairro deve ter pelo menos 2 caracteres')
      .max(100, 'Bairro muito longo'),

    recipientCity: z.string()
      .min(2, 'Cidade deve ter pelo menos 2 caracteres')
      .max(100, 'Cidade muito longa'),

    recipientState: z.string()
      .length(2, 'Estado deve ter 2 caracteres')
      .transform((s: string) => s.toUpperCase())
  }),

  // Product search with enhanced security
  search: z.object({
    q: z.string()
      .min(1, 'Termo de busca é obrigatório')
      .max(100, 'Termo de busca muito longo')
      .regex(/^[a-zA-Z0-9\s\-_áéíóúàèìòùâêîôûãõç]+$/, 'Termo de busca contém caracteres inválidos')
      .optional(),

    category: z.string()
      .max(50, 'Categoria inválida')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Categoria contém caracteres inválidos')
      .optional(),

    minPrice: z.number()
      .min(0, 'Preço mínimo deve ser positivo')
      .max(999999, 'Preço mínimo muito alto')
      .optional(),

    maxPrice: z.number()
      .min(0, 'Preço máximo deve ser positivo')
      .max(999999, 'Preço máximo muito alto')
      .optional(),

    sortBy: z.enum(['name', 'price', 'created_at', 'updated_at'])
      .optional(),

    sortOrder: z.enum(['asc', 'desc'])
      .optional(),

    page: z.number()
      .int('Página deve ser um número inteiro')
      .min(1, 'Página deve ser maior que zero')
      .max(1000, 'Página muito alta')
      .optional(),

    limit: z.number()
      .int('Limite deve ser um número inteiro')
      .min(1, 'Limite deve ser maior que zero')
      .max(100, 'Limite muito alto')
      .optional()
  }),

  // Freight calculation
  freight: z.object({
    postalCode: z.string()
      .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
      .transform((cep: string) => cep.replace(/\D/g, '')),

    weight: z.number()
      .min(1, 'Peso deve ser maior que zero')
      .max(50000, 'Peso muito alto') // 50kg max
  }),

  // Product creation/update (admin)
  product: z.object({
    name: z.string()
      .min(2, 'Nome do produto deve ter pelo menos 2 caracteres')
      .max(200, 'Nome muito longo'),

    description: z.string()
      .max(2000, 'Descrição muito longa')
      .optional(),

    price: z.number()
      .min(0.01, 'Preço deve ser maior que zero'),

    quantity: z.number()
      .int('Quantidade deve ser um número inteiro')
      .min(0, 'Quantidade não pode ser negativa'),

    categoryId: z.number()
      .int('ID da categoria deve ser um número inteiro')
      .min(1, 'ID da categoria inválido'),

    weight: z.number()
      .min(1, 'Peso deve ser maior que zero')
      .max(50000, 'Peso muito alto')
      .optional(),

    featured: z.boolean().optional(),
    visible: z.boolean().optional()
  })
};

/**
 * Middleware factory for request validation
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize and validate request body
      const validatedData = schema.parse(req.body);

      // Replace request body with validated and sanitized data
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Dados inválidos',
          details: errorMessages
        });
        return;
      }

      console.error('Validation error:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
      return;
    }
  };
};

/**
 * Middleware for query parameter validation
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Convert query parameters to appropriate types
      const queryData: any = {};

      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          // Try to convert numeric strings to numbers
          if (/^\d+(\.\d+)?$/.test(value)) {
            queryData[key] = parseFloat(value);
          } else {
            queryData[key] = value;
          }
        } else {
          queryData[key] = value;
        }
      }

      const validatedData = schema.parse(queryData);
      req.query = validatedData as any;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          details: errorMessages
        });
        return;
      }

      console.error('Query validation error:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
      return;
    }
  };
};

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Muitas requisições, tente novamente em 15 minutos'
  },

  // Auth endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 5, // More permissive in development
    message: 'Muitas tentativas de login, tente novamente em 15 minutos'
  },

  // Freight calculation (moderate)
  freight: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per minute
    message: 'Muitas consultas de frete, tente novamente em 1 minuto'
  }
};
