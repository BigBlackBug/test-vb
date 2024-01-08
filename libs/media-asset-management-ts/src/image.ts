import crypto from 'crypto';

import { ZodTypeAny, z } from 'zod';

import {
  AssetLicense,
  AssetLicensePurpose,
  AssetLicenseSchema,
  AssetSchema,
  AssetType,
} from './asset';
import { AssetIDStore } from './assetIDStore';
import {
  AssetDownloadRequestSchema,
  AssetDownloadResponseSchema,
  AssetSource,
} from './assetSource';
import { AssetToS3Request } from '@libs/app-asset-to-s3/src';

export enum ImageSize {
  Custom = 'custom',
  Huge = 'huge',
  Medium = 'medium',
  Small = 'small',
  Vector = 'vector',
}

export const ImageSchema = AssetSchema.extend({
  aspect: z.number(),
  height: z.number(),
  width: z.number(),
});
export type Image = z.infer<typeof ImageSchema>;

export const ImageAssetLicenseSchema = AssetLicenseSchema.extend({
  assetType: z.literal(AssetType.Image), // restriction of the allowed asset types requires this literal conversion :^(
});
export type ImageAssetLicense = z.infer<typeof ImageAssetLicenseSchema>;

/**
 * The schema for individual images sent in license requests to this service.
 */
export const LicenseImageRequestImageSchema = z.object({
  account_id: z.string(),
  source_asset_id: z.string(),
  purpose: z.nativeEnum(AssetLicensePurpose),
  size: z.nativeEnum(ImageSize),
  source_search_id: z.string(),
});

export type LicenseImageRequestImage = z.infer<typeof LicenseImageRequestImageSchema>;

/**
 * The schema for license requests to this service.
 */
export const LicenseImageRequestSchema = z.object({
  images: z.array(LicenseImageRequestImageSchema),
});

export type LicenseImageRequest = z.infer<typeof LicenseImageRequestSchema>;

export const ImageAssetDownloadRequestSchema = AssetDownloadRequestSchema.extend({
  asset: ImageSchema,
  license: ImageAssetLicenseSchema,
});

export type ImageAssetDownloadRequest = z.infer<typeof ImageAssetDownloadRequestSchema>;

export const ImageAssetDownloadResponseSchema = AssetDownloadResponseSchema.extend({
  asset: ImageSchema,
  license: ImageAssetLicenseSchema,
});

export type ImageAssetDownloadResponse = z.infer<typeof ImageAssetDownloadResponseSchema>;

export abstract class ImageAssetSource extends AssetSource<Image, ImageAssetLicense> {
  protected assetIDStore: AssetIDStore;

  constructor(assetIDStore: AssetIDStore) {
    super();
    this.assetIDStore = assetIDStore;
  }

  /**
   * Builds an AssetToS3Request to download a licensed asset.
   *
   * Shutterstock's download service reports an inaccurate `Content-Length` for images. This throws
   * off our multipart upload planning, resulting in corrupted images. Images are typically smaller
   * and faster to download anyway, so we'll use a single streaming upload to S3 for them.
   */
  buildAssetToS3Request(license: ImageAssetLicense, key: string): AssetToS3Request {
    return {
      url: license.sourceDownloadURL,
      bucket: this.getS3Bucket(),
      acl: 'public-read',
      key,
      multipart: false,
    };
  }

  getAssetID(image: Image) {
    return crypto
      .createHash('sha256')
      .update(`${image.source}-${this.getAssetType()}-${image.sourceAssetID}`)
      .digest('hex');
  }

  generateAssetID(license: AssetLicense) {
    return crypto
      .createHash('sha256')
      .update(`${license.source}-${license.assetType}-${license.sourceAssetID}`)
      .digest('hex');
  }

  getAssetLicenseSchema(): ZodTypeAny {
    return ImageAssetLicenseSchema;
  }

  getAssetSchema(): ZodTypeAny {
    return ImageSchema;
  }

  getAssetType(): AssetType.Image {
    return AssetType.Image;
  }

  /**
   * Returns the S3 bucket where images should be downloaded.
   *
   * It's sp-prod-s3-customer-assets for production, and
   * sp-dev-s3-customer-assets for everything else.
   */
  getS3Bucket() {
    return `sp-${
      process.env.APPLICATION_ENVIRONMENT === 'wm-prod' ? 'prod' : 'dev'
    }-s3-customer-assets`;
  }

  getS3Key(license: AssetLicense) {
    const assetID = this.generateAssetID(license);
    return `images/${assetID}`;
  }

  getS3ThumbKey(image: Image) {
    const assetID = this.getAssetID(image);
    return `images/${assetID}_thumb`;
  }
}
