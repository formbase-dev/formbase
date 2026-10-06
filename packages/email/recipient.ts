import { z } from 'zod';

export const recipientEmailSchema = z
  .string()
  .max(254)
  .pipe(z.string().email());
