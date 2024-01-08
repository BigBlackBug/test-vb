// Vendor
import {
  CognitoIdentityClient,
  GetOpenIdTokenForDeveloperIdentityCommand,
} from '@aws-sdk/client-cognito-identity';

// Local
import { DEFAULT_REGION } from './constants';
import { getLogger } from 'libs/logging-ts';
import { WaymarkIdentity } from 'libs/shared-types';
import { requireEnvironmentVariable } from 'libs/util-lambda';

export interface GetIdentityInputOptions {
  region?: string;
  duration?: number;
  userAttributes?: Record<string, string>;
}

export interface GetIdentityInput {
  userName: string;
  options: GetIdentityInputOptions;
}

// How long, in seconds, the temporary STS credentials will be good for. The maximum is 12 hours.
export const DEFAULT_TOKEN_DURATION_SECONDS = 6 * 60 * 60;

const logger = getLogger({ metadata: { service: 'service-access' } });

/**
 * Creates a logged-in Waymark identity object that can be used for priming an Axios connection
 * client to use with protected Waymark API endpoints or SDK usage.
 *
 * @param userName: the Ivory application LoginUser user name, becomes part of the Identity Pool identity for that user.
 * @param options.region: defaults to AWS_REGION.
 * @param options.duration: in seconds, defaults to 2 hours.
 * @param options.userAttributes: custom claims to add to the user's identity which can be used
 * to perform fine-grained access control.
 */
export const getUserIdentity = async (
  userName: string,
  refreshURL: string,
  options: GetIdentityInputOptions = {},
): Promise<WaymarkIdentity> => {
  const {
    region = DEFAULT_REGION,
    duration = DEFAULT_TOKEN_DURATION_SECONDS,
    userAttributes = {},
  } = options;

  logger.debug('getUserIdentity:', {
    region: region || 'us-east-2',
    duration,
    userAttributes,
  });

  const identityPoolID = getIdentityPoolID();
  const applicationPoolName = requireEnvironmentVariable(
    'APPLICATION_IDENTITY_DEVELOPER_PROVIDER_NAME',
  );

  // The following will create or update an entry in the application identity pool for the user
  // passed in via `userName`. That user name must be unique in the identity pool.
  const client = new CognitoIdentityClient({ region });
  const props = {
    IdentityPoolId: identityPoolID,
    Logins: {
      [applicationPoolName]: userName,
    },
    TokenDuration: duration,
    PrincipalTags: userAttributes,
  };
  const command = new GetOpenIdTokenForDeveloperIdentityCommand(props);
  const identityResponse = await client.send(command);

  const credentials = {
    identityPoolID,
    identityID: identityResponse.IdentityId,
    token: identityResponse.Token,
  };

  const nowDate = new Date();
  // Token duration is seconds, but JavaScript thinks in milliseconds for dates.
  const expiration = Date.now() + duration * 1000;
  const expirationDate = new Date(expiration);

  logger.debug(
    `Expiration date: ${duration}s from ${nowDate.toISOString()}: ${expirationDate.toISOString()}`,
  );

  return {
    credentials,
    region,
    userName,
    refreshURL,
    // UTC expiration time.
    expiration,
  };
};

/**
 * Creates an anonymous Waymark identity object that can be used for priming an Axios connection
 * client to use with public Waymark API endpoints or SDK usage.
 *
 * @param options.region: defaults to AWS_REGION.
 */
export const getAnonymousIdentity = (): WaymarkIdentity => {
  const identityPoolID = getIdentityPoolID();

  const credentials = {
    identityPoolID,
  };

  return {
    credentials,
  };
};

const getIdentityPoolID = (): string => {
  return requireEnvironmentVariable('APPLICATION_IDENTITY_POOL_ID');
};
