import { z } from 'zod';

export const AccountInfoZod = z.object({
  id: z.string(),
  externalID: z.string().or(z.null()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  emailAddress: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
export type AccountInfo = z.infer<typeof AccountInfoZod>;

// This is the same as AccountInfoZod but without fields which can't be set manually or updated
export const UpdatableAccountInfoZod = AccountInfoZod.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type UpdatableAccountInfo = z.infer<typeof UpdatableAccountInfoZod>;
