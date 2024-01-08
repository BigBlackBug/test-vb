import { AxiosInstance } from 'axios';

import { ServiceDiscoverySDK } from '@libs/service-discovery-sdk';
import { AxiosSignedConnectionSource } from '@libs/service-access-lib';
import type { Service, WaymarkServiceAccessKey } from '@libs/shared-types';

import store from 'app/state/store';
import * as selectors from 'app/state/selectors/index.js';

export interface VoiceoverRespellRequest {
  text: string;
}

/**
 * Service for managing VoiceoverRespell assets.
 */
class VoiceoverRespellService {
  private serviceAccessKey: WaymarkServiceAccessKey | null = null;
  private serviceConfiguration: Service | null = null;
  private connection: AxiosInstance | null = null;

  /**
   * Creates a signed connection source which we can use to hit the service API.
   *
   * @param {WaymarkServiceAccessKey} serviceAccessKey
   */
  private async getConnection() {
    const serviceAccessKey = selectors.getServiceAccessToken(store.getState());
    if (this.connection && serviceAccessKey === this.serviceAccessKey) {
      return this.connection;
    }

    this.serviceAccessKey = serviceAccessKey;
    const connectionSource = new AxiosSignedConnectionSource(serviceAccessKey.identity);
    this.connection = await connectionSource.getSignedConnection();

    return this.connection;
  }

  /**
   * Gets the configuration for the VoiceoverRespell service which most importantly
   * gives us the URL for the service's API.
   */
  private async getServiceConfiguration() {
    const serviceAccessKey = selectors.getServiceAccessToken(store.getState());

    if (!serviceAccessKey) {
      throw new Error('Could not find service access token for VoiceoverRespellService');
    }

    if (this.serviceAccessKey !== serviceAccessKey) {
      this.serviceAccessKey = serviceAccessKey;
      const serviceDiscovery = new ServiceDiscoverySDK(serviceAccessKey);
      this.serviceConfiguration = await serviceDiscovery.discoverService('VoiceoverRespell');
    }

    if (!this.serviceConfiguration) {
      throw new Error('Unable to find service configuration for voiceover-respell');
    }

    return this.serviceConfiguration;
  }

  /**
   * Respells a collection of words phonetically using the VoiceoverRespell service.
   */
  async respellWords(wordsToRespell: VoiceoverRespellRequest): Promise<XMLDocument> {
    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL('/', serviceConfiguration.baseURL);

    const connection = await this.getConnection();

    const response = await connection.post<string>(url.toString(), wordsToRespell);

    // Converting the response string to XML so that we can find the respelled words in the response.
    return new DOMParser().parseFromString(response.data, 'text/xml');
  }
}

export default new VoiceoverRespellService();
