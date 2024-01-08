import _ from 'lodash';
import { z } from 'zod';

import {
  AssetLicensePurpose,
  ImageSize,
  LicenseImageRequest,
  LicenseImageRequestImage,
  LicenseImageRequestSchema,
} from 'libs/media-asset-management-ts';
import { ShutterstockAPIConfiguration } from '../configuration';
import { ShutterstockError } from '../error';
import { ShutterstockPrice } from '../request';
import { ShutterstockURL } from '../response';

/**
 * The schema for Shutterstock image licensing requests.
 */
export const ShutterstockLicenseImageRequestSchema = z.object({
  images: z.array(
    z.object({
      metadata: z.object({
        customer_id: z.string(),
        search_id: z.string(),
      }),
      size: z.nativeEnum(ImageSize),
      subscription_id: z.string(),
      image_id: z.string(),
    }),
  ),
});

export type ShutterstockLicenseImageRequest = z.infer<typeof ShutterstockLicenseImageRequestSchema>;

/**
 * Determine the right subscription to use for the given image's purpose.
 */
export function getImageSubscriptionID(
  configuration: ShutterstockAPIConfiguration,
  image: LicenseImageRequestImage,
): string {
  return configuration.image[
    image.purpose == AssetLicensePurpose.Render
      ? AssetLicensePurpose.Render
      : AssetLicensePurpose.Preview
  ].subscriptionID;
}

/**
 * Construct a list of image licensing requests for the Shutterstock API from our image licensing
 * request.
 */
export function buildShutterstockLicenseImageRequests(
  configuration: ShutterstockAPIConfiguration,
  licenseImageRequest: LicenseImageRequest,
): ShutterstockLicenseImageRequest[] {
  LicenseImageRequestSchema.parse(licenseImageRequest);

  const allImageRequests = licenseImageRequest.images.map((i) => {
    return {
      metadata: {
        search_id: i.source_search_id,
        customer_id: '',
        geo_location: '',
        number_viewed: '',
      },
      size: i.size,
      subscription_id: getImageSubscriptionID(configuration, i),
      image_id: i.source_asset_id,
    };
  });

  const groupsOf50 = _.chunk(allImageRequests, 50);

  return groupsOf50.map((group) => {
    return { images: group };
  });
}

export interface ShutterstockLicenseImageResult {
  image_id: string;
  allotment_charge: number;
  download: ShutterstockURL;
  error: string;
  license_id: string;
  price: ShutterstockPrice;
}

export interface ShutterstockLicenseImageResponse {
  data: ShutterstockLicenseImageResult[];
  errors?: ShutterstockError[];
  message: string;
  page: number;
  per_page: number;
  total_count: number;
}
