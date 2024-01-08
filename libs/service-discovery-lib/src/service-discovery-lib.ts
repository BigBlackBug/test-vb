// Vendor
import { AxiosResponse } from 'axios';
import { ServiceDiscoveryClient, DiscoverInstancesCommand } from '@aws-sdk/client-servicediscovery';

// Local
import { getLogger } from 'libs/logging-ts';
import { Service, WaymarkServiceAccessKey } from 'libs/shared-types';

const logger = getLogger({ metadata: { service: 'service-discovery-lib' } });

export type ServicePath = string;

export declare class ServiceInvocationError extends Error {
  message: string;
  response?: AxiosResponse;

  constructor(message: string, response?: AxiosResponse);
}

export const getServiceDiscoveryEndpoint = () => {
  return process.env.SERVICE_DISCOVERY_ENDPOINT as string;
};

export const discoverService = async (serviceName: string): Promise<Service> => {
  console.log('Discovering', serviceName, 'service');
  const client = new ServiceDiscoveryClient({});
  const command = new DiscoverInstancesCommand({
    NamespaceName: `${process.env.APPLICATION_ENVIRONMENT}.waymark.com`,
    QueryParameters: {
      // Selects for instances that have a host
      serviceType: 'service-api',
    },
    ServiceName: serviceName,
  });

  const response = await client.send(command);
  if (!('Instances' in response)) {
    throw new Error(`No service found for ${serviceName}`);
  }

  if (!response.Instances?.length) {
    throw new Error(`No service instances found for ${serviceName}`);
  }

  const { Instances: instances } = response;

  const instance = instances[0];
  logger.debug('Found instance', { instance });

  const attributes = instance.Attributes || {};

  return {
    ...attributes,
    serviceName,
  };
};

/**
 * Get a service access key that can be used with a SignedConnectionSource to provide access to
 * any API gateway service explicitly permitted by the invoking service's policies, such as in
 * the Lambda function definition.
 */
export const getLocalServiceAccessKey = (): WaymarkServiceAccessKey => {
  return {
    serviceDiscoveryEndpoint: getServiceDiscoveryEndpoint(),
  };
};
