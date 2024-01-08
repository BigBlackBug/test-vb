import { Timer, getLogger, logAxiosError } from 'libs/logging-ts';
import { AxiosSignedConnectionSource } from 'libs/service-access-lib';
import { Service, SignedConnectionSource, WaymarkServiceAccessKey } from 'libs/shared-types';

export class ServiceDiscoverySDK {
  private serviceAccessKey: WaymarkServiceAccessKey;
  private connectionSource: SignedConnectionSource;

  constructor(serviceAccessKey: WaymarkServiceAccessKey) {
    this.serviceAccessKey = serviceAccessKey;
    this.connectionSource = new AxiosSignedConnectionSource(serviceAccessKey.identity);
  }

  async discoverService(serviceName: string): Promise<Service> {
    const timer = new Timer({
      metadata: { service: 'service-discovery-sdk.discoverService' },
    });

    const connection = await this.connectionSource.getSignedConnection();
    const request = { serviceName };

    try {
      const response = await connection.get(
        `${this.serviceAccessKey.serviceDiscoveryEndpoint}/discover`,
        { params: request },
      );

      return response.data;
    } catch (error) {
      logAxiosError({
        logger: timer,
        error,
        logResponseData: true,
        message: 'Service discovery failed',
        metadata: { serviceName },
      });

      throw error;
    } finally {
      timer.debug('discoverService finished', { serviceName });
    }
  }
}
