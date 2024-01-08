import _ from 'lodash';
import { z } from 'zod';

import { ShutterstockAPIConfiguration } from '../configuration';
import { ShutterstockError } from '../error';
import { ShutterstockPrice } from '../request';
import { ShutterstockURL } from '../response';
import {
  AssetLicensePurpose,
  LicenseVideoRequest,
  LicenseVideoRequestSchema,
  LicenseVideoRequestVideo,
  VideoSize,
} from 'libs/media-asset-management-ts';

/**
 * The schema for Shutterstock video licensing requests.
 */
export const ShutterstockLicenseVideoRequestSchema = z.object({
  videos: z.array(
    z.object({
      metadata: z.object({
        customer_id: z.string(),
        search_id: z.string(),
      }),
      size: z.nativeEnum(VideoSize),
      subscription_id: z.string(),
      video_id: z.string(),
    }),
  ),
});

export type ShutterstockLicenseVideoRequest = z.infer<typeof ShutterstockLicenseVideoRequestSchema>;

/**
 * Determine the right subscription to use for the given video's purpose.
 */
export function getVideoSubscriptionID(
  configuration: ShutterstockAPIConfiguration,
  video: LicenseVideoRequestVideo,
): string {
  return configuration.video[
    video.purpose == AssetLicensePurpose.Render
      ? AssetLicensePurpose.Render
      : AssetLicensePurpose.Preview
  ].subscriptionID;
}

/**
 * Construct a video licensing request for the Shutterstock API from our video licensing request.
 */
export function buildShutterstockLicenseVideoRequests(
  configuration: ShutterstockAPIConfiguration,
  licenseVideoRequest: LicenseVideoRequest,
): ShutterstockLicenseVideoRequest[] {
  LicenseVideoRequestSchema.parse(licenseVideoRequest);

  const allVideoRequests = licenseVideoRequest.videos.map((v) => {
    return {
      metadata: {
        search_id: v.source_search_id,
        customer_id: '',
        geo_location: '',
        number_viewed: '',
      },
      size: v.size,
      subscription_id: getVideoSubscriptionID(configuration, v),
      video_id: v.source_asset_id,
    };
  });
  const groupsOf50 = _.chunk(allVideoRequests, 50);

  return groupsOf50.map((group) => {
    return { videos: group };
  });
}

export interface ShutterstockLicenseVideoResult {
  video_id: string;
  allotment_charge: number;
  download: ShutterstockURL;
  error: string;
  license_id: string;
  price: ShutterstockPrice;
}

export interface ShutterstockLicenseVideoResponse {
  data: ShutterstockLicenseVideoResult[];
  errors?: ShutterstockError[];
  message: string;
  page: number;
  per_page: number;
  total_count: number;
}
