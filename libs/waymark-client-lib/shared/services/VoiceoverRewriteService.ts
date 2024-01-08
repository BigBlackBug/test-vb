import { AxiosInstance } from 'axios';

import store from 'app/state/store';
import * as selectors from 'app/state/selectors/index.js';
import { getBusinessDetailsByGUID } from 'shared/api/graphql/businesses/queries';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

import { AxiosSignedConnectionSource } from '@libs/service-access-lib/src';
import { BusinessInfo } from '@libs/autofill-lib/src';
import { ServiceDiscoverySDK } from '@libs/service-discovery-sdk/src';
import {
  AutofillVideoDescriptorThin,
  Service,
  WaymarkServiceAccessKey,
} from '@libs/shared-types/src';

class VoiceoverRewriteService {
  private serviceAccessKey: WaymarkServiceAccessKey | null = null;
  private serviceConfiguration: Service | null = null;
  private connection: AxiosInstance | null = null;

  /**
   * Creates a connection source if one does not already exist.
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

  private async getServiceConfiguration() {
    const serviceAccessKey = selectors.getServiceAccessToken(store.getState());

    if (!serviceAccessKey) {
      throw new Error('Could not find service access token for VoiceoverRewrite');
    }

    if (this.serviceAccessKey !== serviceAccessKey) {
      this.serviceAccessKey = serviceAccessKey;
      const serviceDiscovery = new ServiceDiscoverySDK(serviceAccessKey);
      this.serviceConfiguration = await serviceDiscovery.discoverService('VoiceoverRewrite');
    }

    if (!this.serviceConfiguration) {
      throw new Error('Unable to find service configuration for VoiceoverRewrite');
    }

    return this.serviceConfiguration;
  }

  static transformBusinessDetailsToBusinessInfo(
    businessDetails: CoreBusinessDetails,
  ): BusinessInfo {
    return {
      name: businessDetails.businessName,
      guid: businessDetails.guid,
      streetAddress1: businessDetails.streetAddress1,
      streetAddress2: businessDetails.streetAddress2,
      streetAddress3: '',
      city: businessDetails.city,
      state: businessDetails.state,
      countryCode: '',
      postalCode: businessDetails.postalCode,
      phone: businessDetails.contactPhone,
      description: businessDetails.businessAbout,
      websiteURL: businessDetails.websiteUrl,
      industry: businessDetails.industryName,
    };
  }

  async rewriteVoiceover(
    videoDescriptor: AutofillVideoDescriptorThin,
    businessGUID: string | null = null,
    speakerPace: number | null = null,
  ) {
    // Fetch the selected business so we can use it to generate the new script
    const businessDetailsResponse = await getBusinessDetailsByGUID(businessGUID, 'network-only');

    // we have so many different types for business info / details
    const businessInfo = businessDetailsResponse
      ? VoiceoverRewriteService.transformBusinessDetailsToBusinessInfo(
          businessDetailsResponse?.data?.businessByGuid,
        )
      : null;

    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL('/', serviceConfiguration.baseURL);

    const connection = await this.getConnection();
    const response = await connection.post(url.toString(), {
      businessInfo,
      videoDescriptor,
      speakerPace,
    });

    return response.data.voiceOver as string;
  }
}

export default new VoiceoverRewriteService();
