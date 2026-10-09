import { z } from "zod";

export const orderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).max(100), phone: z.string().trim().min(7).max(24),
    email: z.email().optional().or(z.literal("")), address: z.string().trim().min(8).max(300),
    city: z.string().trim().min(2).max(100), district: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
  items: z.array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
  idempotencyKey: z.uuid(),
});

export const newsletterSchema = z.object({ email: z.email().max(254), consent: z.literal(true), website: z.string().max(0).optional() });
