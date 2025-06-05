/**
 * VALIDAÇÃO SIMPLIFICADA PARA CORRIGIR BUILD
 * 
 * Este arquivo substitui temporariamente o validation.ts problemático
 * para permitir que o build funcione enquanto corrigimos os tipos.
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Função simples de sanitização
 */
function sanitizeInput(input: string): string {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Schemas de validação simplificados
 */
export const validationSchemas = {
  // User registration
  register: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email().max(255),
    password: z.string().min(6).max(100),
    name: z.string().min(2).max(100),
    phone: z.string().optional(),
    cpf: z.string().optional()
  }),

  // User login
  login: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  }),

  // Address validation
  address: z.object({
    postalCode: z.string().length(8),
    street: z.string().min(5),
    shippingOption: z.string().min(1),
    recipientName: z.string().min(2).max(100),
    streetAddress: z.string().min(5).max(200),
    number: z.string().max(20),
    complement: z.string().max(100).optional(),
    neighborhood: z.string().min(2).max(100),
    city: z.string().min(2).max(100),
    state: z.string().length(2)
  }),

  // Search validation
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    category: z.string().max(50).optional(),
    featured: z.enum(['true', 'false']).optional(),
    visible: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['name', 'price', 'createdAt', 'rating']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.number().int().min(1).max(1000).optional(),
    limit: z.number().int().min(1).max(100).optional()
  }),

  // Freight calculation
  freight: z.object({
    postalCode: z.string().length(8),
    weight: z.number().min(1).max(50000)
  }),

  // Product validation
  product: z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),
    price: z.number().min(0.01).max(999999.99),
    compareAtPrice: z.number().min(0.01).max(999999.99).optional(),
    sku: z.string().min(1).max(50),
    weight: z.number().min(1).max(50000),
    categoryId: z.number().int().min(1),
    quantity: z.number().int().min(0).optional()
  })
};

/**
 * Middleware de validação simplificado
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitizar dados de entrada
      if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
          if (typeof req.body[key] === 'string') {
            req.body[key] = sanitizeInput(req.body[key]);
          }
        }
      }

      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Dados de entrada inválidos',
          details: errors
        });
        return;
      }

      res.status(500).json({
        error: 'Erro interno do servidor'
      });
      return;
    }
  };
};

/**
 * Middleware de validação de query simplificado
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Converter query params para tipos apropriados
      const queryData: any = {};
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          // Tentar converter números
          if (!isNaN(Number(value)) && value !== '') {
            queryData[key] = Number(value);
          } else {
            queryData[key] = sanitizeInput(value);
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
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          details: errors
        });
        return;
      }

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
  general: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições, tente novamente em 15 minutos'
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos'
  },
  freight: {
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Muitas consultas de frete, tente novamente em 1 minuto'
  }
};
