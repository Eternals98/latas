import { z } from 'zod';

// Sale validation
export const saleSchema = z.object({
  company_id: z.string().min(1, 'Empresa requerida'),
  customer_id: z.string().optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Fecha inválida'),
  document_number: z.string().optional(),
  description: z.string().min(3, 'Descripción requerida (mínimo 3 caracteres)'),
  total_amount: z.number().positive('Monto debe ser mayor a 0'),
  payments: z.array(
    z.object({
      payment_method_id: z.string().min(1, 'Método de pago requerido'),
      amount: z.number().positive('Monto debe ser mayor a 0'),
    })
  ).min(1, 'Agregue al menos un pago'),
}).refine(
  (d) => Math.abs(d.payments.reduce((s, p) => s + p.amount, 0) - d.total_amount) < 0.01,
  { message: 'Suma de pagos debe coincidir con el total', path: ['payments'] }
);

// Cash opening validation
export const cashOpenSchema = z.object({
  opening_balance: z.number().nonnegative('Monto inicial debe ser positivo'),
});

// Cash withdrawal validation
export const withdrawalSchema = z.object({
  amount: z.number().positive('Monto requerido'),
  description: z.string().min(3, 'Motivo requerido (mínimo 3 caracteres)'),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

// Registration validation
export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Nombre requerido (mínimo 2 caracteres)'),
});
