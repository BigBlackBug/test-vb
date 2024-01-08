import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { AppError, HttpStatusCode } from 'libs/lambda-routing';
import { getLogger } from 'libs/logging-ts';
import { SimpleExpiringCache } from 'libs/ts-simple-cache';
import { MultiValueSecret } from './secret';

// Cache secrets for 30 minutes, unless directed otherwise via the environment.
const secretCache = new SimpleExpiringCache(
  Number.parseInt(process.env.SHARED_SECRET_CACHE_EXPIRATION || '') || 30 * 60 * 1000,
);

export async function checkSharedSecret(
  secret: string,
  parameter?: string,
  cache?: boolean,
): Promise<boolean> {
  const logger = getLogger({ metadata: { service: 'checkSharedSecret' } });

  const secretParameter = parameter || `${process.env.APPLICATION_ENVIRONMENT}/api/sharedSecret`;
  let isVerified = (await getSharedSecret(secretParameter, cache)).verify(secret);

  if (isVerified) {
    logger.debug('Matched secret.');
  } else {
    logger.error('Unmatched secret. Refreshing cache entry and retrying.');
    secretCache.delete(secretParameter);
    isVerified = (await getSharedSecret(secretParameter, cache)).verify(secret);
  }

  return isVerified;
}

export async function getSharedSecret(
  parameter?: string,
  cache: boolean = true,
): Promise<MultiValueSecret> {
  const logger = getLogger({ metadata: { service: 'getSharedSecret' } });

  let secretName = parameter || `${process.env.APPLICATION_ENVIRONMENT}/api/sharedSecret`;

  if (cache) {
    const cachedValue = secretCache.get(secretName);
    if (cachedValue !== undefined) {
      return secretCache.get(secretName) as MultiValueSecret;
    }
  }

  const ssm = new SSMClient({ region: process.env.AWS_REGION });

  // Look up the given parameter, or the one specified in the SHARED_SECRET_PARAMETER environment
  // variable set in the SAM template. Note that the latter will have to have a slash prepended, to
  // amend the broken parameter name we have to feed to SAM's policy construction.
  if (!secretName.startsWith('/')) {
    secretName = `/${secretName}`;
  }

  const getParameterCommand = {
    Name: secretName,
    WithDecryption: true,
  };

  try {
    const result = await ssm.send(new GetParameterCommand(getParameterCommand));
    const value = new MultiValueSecret(result?.Parameter?.Value || '');
    if (cache) {
      secretCache.set(secretName, value);
    }
    return value;
  } catch (err) {
    logger.error(
      `Error retrieving shared secret ${secretName} in region ${process.env.AWS_REGION}: ${err}`,
      { error: err },
    );
    throw new AppError(
      `Could not retrieve shared secret.`,
      err instanceof Error ? err : undefined,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
}
