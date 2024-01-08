import path from 'path';

import _ from 'lodash';

import {
  GetParametersCommand,
  GetParametersCommandOutput,
  Parameter,
  ParameterType,
  SSMClient,
} from '@aws-sdk/client-ssm';

import { Timer, getLogger, logAxiosError } from 'libs/logging-ts';
import { SimpleExpiringCache } from 'libs/ts-simple-cache';

const DEFAULT_TTL = 60 * 1000; // one minute
const PROD_TTL = 10 * DEFAULT_TTL;
const configCache = new SimpleExpiringCache(
  process.env.APPLICATION_ENVIRONMENT == 'wm-prod' ? PROD_TTL : DEFAULT_TTL,
);

type GetConfigurationMock = (key: string, required: boolean, requireJSON: boolean) => Promise<any>;

let getConfigurationMock: null | GetConfigurationMock = null;

/**
 * Use this to mock the behavior of getConfiguration in tests.
 * @param newMock
 */
export const setGetConfigurationMock = (newMock: GetConfigurationMock) => {
  getConfigurationMock = newMock;
};

/**
 * If `setGetConfigurationMock` has been called, this will reset/revert that. The default behavior
 * of `getConfiguration` will be restored.
 */
export const resetGetConfigurationMock = () => {
  getConfigurationMock = null;
};

export function redactParameter(parameter: Parameter): Parameter {
  const clone = _.cloneDeep(parameter);
  if (clone.Type == ParameterType.SECURE_STRING) {
    clone.Value = '[REDACTED]';
  }
  return clone;
}

export function redactGetParametersCommandOutput(
  output: GetParametersCommandOutput,
): GetParametersCommandOutput {
  const clone = _.cloneDeep(output);
  if (clone.Parameters) {
    clone.Parameters = clone.Parameters.map((parameter) => redactParameter(parameter));
  }
  return clone;
}

// Until we have configuration management worked out, this is better than environment variables.
export async function getConfiguration(
  key: string,
  required: boolean = true,
  requireJSON: boolean = false,
) {
  const logger = getLogger({ metadata: { service: 'app-config-ts/getConfiguration' } });

  if (getConfigurationMock !== null) {
    logger.debug('Using mock getConfiguration');
    return getConfigurationMock(key, required, requireJSON);
  }

  const cachedValue = configCache.get(key);
  if (cachedValue) {
    return cachedValue;
  }

  const environmentKey = path.join('/', process.env.APPLICATION_ENVIRONMENT || '', key);
  const globalKey = path.join('/global', key);

  const clientTimer = new Timer(logger.configuration);
  const ssm = new SSMClient({ region: process.env.AWS_REGION });
  clientTimer.debug('Created SSMClient');

  try {
    // Look for the key under the application environment path, then global.
    const getParametersCommand = { Names: [environmentKey, globalKey], WithDecryption: true };
    const getParametersTimer = new Timer(logger.configuration);
    const result = await ssm.send(new GetParametersCommand(getParametersCommand));
    getParametersTimer.debug('Received GetParametersCommand result', {
      result: redactGetParametersCommandOutput(result),
    });

    // Get all the valid parameters returned, and because the order of Parameters in
    // GetParametersCommandOutput is not specified, build a Map of name to value, to ensure that we
    // prefer the environment-specific value to the global.
    const values = (result.Parameters || [])
      .map((parameter) => {
        if (!parameter.Value) {
          logger.debug('Parameter Value is empty', { parameter });
          return undefined;
        }

        if (!parameter.Name) {
          logger.debug('Parameter Name is empty', { parameter });
          return undefined;
        }

        try {
          const parsedParameter = JSON.parse(parameter.Value);

          return {
            name: parameter.Name,
            value: 'value' in parsedParameter ? parsedParameter.value : parsedParameter,
          };
        } catch (error) {
          logger.debug('Could not parse parameter as JSON', {
            parameter: redactParameter(parameter),
            error,
          });
        }

        // If the parameter is supposed to be valid JSON, stop here.
        if (requireJSON) {
          return undefined;
        }

        // Some parameters are still plain strings, so if JSON isn't required, return whatever's
        // found.
        return {
          name: parameter.Name,
          value: parameter.Value,
        };
      })
      .reduce((values, currentValue) => {
        if (currentValue) {
          values.set(currentValue.name, currentValue.value);
        }
        return values;
      }, new Map<string, any>());

    const value = values.get(environmentKey) || values.get(globalKey);

    if (required && !value) {
      throw new Error(
        `No valid configuration found in Parameter Store for "${environmentKey}" or "${globalKey}" in region ${process.env.AWS_REGION}`,
      );
    }
    configCache.set(key, value);
    return value;
  } catch (error) {
    const message = `Error retrieving configuration from Parameter Store under "${environmentKey}" or "${globalKey}" in region ${process.env.AWS_REGION}`;
    logAxiosError({
      message: message,
      error,
      logger,
    });
    throw new Error(message, { cause: error });
  }
}
