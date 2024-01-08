import { z } from 'zod';

import { getConfiguration } from 'libs/app-config-ts';
import { getLogger } from 'libs/logging-ts';

export const SHUTTERSTOCK_SOURCE_NAME = 'shutterstock';

/**
 * Right now the configuration just consists of API tokens and subscription IDs, but we have
 * different accounts and credentials for images and videos, and preview versus render quality.
 */
const ShutterstockAPIConfigurationSchema = z.object({
  baseURL: z.enum(['https://api.shutterstock.com', 'https://api-sandbox.shutterstock.com']),
  image: z.object({
    preview: z.object({
      apiToken: z.string(),
      subscriptionID: z.string(),
    }),
    render: z.object({
      apiToken: z.string(),
      subscriptionID: z.string(),
    }),
  }),
  video: z.object({
    preview: z.object({
      apiToken: z.string(),
      subscriptionID: z.string(),
    }),
    render: z.object({
      apiToken: z.string(),
      subscriptionID: z.string(),
    }),
  }),
});

export type ShutterstockAPIConfiguration = z.infer<typeof ShutterstockAPIConfigurationSchema>;

/**
 * The name of the parameter in Parameter Store under which the service's configuration is kept.
 */
export const SHUTTERSTOCK_API_CONFIGURATION_KEY = `/services/${SHUTTERSTOCK_SOURCE_NAME}/api-configuration`;
export const SHUTTERSTOCK_ASSET_ID_STORE_CONFIGURATION_KEY = `/services/${SHUTTERSTOCK_SOURCE_NAME}/asset-id-store-configuration`;

/**
 * Retrieve the service configuration.
 */
export async function getShutterstockAPIConfiguration(): Promise<ShutterstockAPIConfiguration> {
  const logger = getLogger({ metadata: { service: 'getShutterstockAPIConfiguration' } });

  const configuration = await getConfiguration(SHUTTERSTOCK_API_CONFIGURATION_KEY, true);

  logger.info('Shutterstock configuration', { configuration });

  // Zod will throw ZodError here if the configuration in Parameter Store doesn't validate according
  // to the ShutterstockAPIConfigurationSchema.
  try {
    const validatedConfiguration = ShutterstockAPIConfigurationSchema.parse(configuration);
    return validatedConfiguration;
  } catch (error) {
    logger.error('Invalid Shutterstock configuration', { configuration, error });
    throw new Error('Invalid Shutterstock configuration', { cause: error });
  }
}
