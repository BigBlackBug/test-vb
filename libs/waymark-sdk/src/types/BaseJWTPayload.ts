import { z } from 'zod';

export const BaseJWTPayload = z.object({
  jti: z.string(),
  iss: z.string(),
  aud: z.literal('waymark.com'),
  iat: z.number(),
  exp: z.number(),
});
