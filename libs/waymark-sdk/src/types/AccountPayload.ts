import { z } from 'zod';
import { BaseJWTPayload } from './BaseJWTPayload';
import { UpdatableAccountInfoZod } from './AccountInfo';
import { KJUR } from 'jsrsasign';

const LoginAccountDataZod = z
  .object({
    accountID: z.string(),
    externalID: z.string(),
  })
  .partial()
  .refine(
    (val) => val.accountID || val.externalID,
    'Either accountID or externalID must be provided for loginAccount payload',
  );

const LoginAccountJWTPayloadZod = BaseJWTPayload.merge(
  z.object({
    'https://waymark.com/sdk/account': LoginAccountDataZod,
  }),
);
export type LoginAccountJWTPayload = z.infer<typeof LoginAccountJWTPayloadZod>;
export type LoginAccountData = LoginAccountJWTPayload['https://waymark.com/sdk/account'];

export const LoginAccountJWT = z
  .string()
  .transform((jwtString) =>
    LoginAccountJWTPayloadZod.parse(KJUR.jws.JWS.parse(jwtString).payloadObj),
  );

const CreateAccountJWTPayloadZod = BaseJWTPayload.merge(
  z.object({
    'https://waymark.com/sdk/account': UpdatableAccountInfoZod,
  }),
);
export type CreateAccountJWTPayload = z.infer<typeof CreateAccountJWTPayloadZod>;
export type CreateAccountData = CreateAccountJWTPayload['https://waymark.com/sdk/account'];
export const CreateAccountJWT = z
  .string()
  .transform((jwtString) =>
    CreateAccountJWTPayloadZod.parse(KJUR.jws.JWS.parse(jwtString).payloadObj),
  );

export const UpdateAccountInfoPayloadZod = UpdatableAccountInfoZod.partial();
export type UpdateAccountInfoPayload = z.infer<typeof UpdateAccountInfoPayloadZod>;
