import { AxiosResponse } from 'axios';
import { z } from 'zod';

import { AssetToS3Request, AssetToS3Response, AssetToS3ResponseSchema } from 'libs/app-asset-to-s3';
import { Timer, getLogger, logAxiosError } from 'libs/logging-ts';
import { AxiosSignedConnectionSource } from 'libs/service-access-lib';
import { getLocalServiceAccessKey } from 'libs/service-discovery-lib';
import { ServiceDiscoverySDK } from 'libs/service-discovery-sdk';
import { constructS3URL, doesFileExistInS3, getBucketRegion } from 'libs/util-s3';

import { Asset, AssetLicense, AssetLicenseSchema, AssetSchema, AssetType } from './asset';

/**
 * A request to download a licensed asset.
 */
export const AssetDownloadRequestSchema = z.object({
  asset: AssetSchema,
  license: AssetLicenseSchema,
});

export type AssetDownloadRequest = z.infer<typeof AssetDownloadRequestSchema>;

/**
 * Our response to a request to download a licensed asset.
 */
export const AssetDownloadResponseSchema = z.object({
  asset: AssetSchema,
  license: AssetLicenseSchema,
  assetToS3Response: AssetToS3ResponseSchema,
});

export type AssetDownloadResponse = z.infer<typeof AssetDownloadResponseSchema>;

export interface AssetDownloadThumbResponse<AssetT> {
  asset: AssetT;
  assetToS3Response: AssetToS3Response;
}

/**
 * Our response to an asset licensing request.
 */
export interface AssetLicenseResponse<AssetLicenseT extends AssetLicense> {
  assetLicenses: AssetLicenseT[];
}

/**
 * Our response to an asset search request.
 */
export interface AssetSearchResponse<AssetT extends Asset> {
  page: number;
  per_page: number;
  total_count: number;
  assets: AssetT[];
}

/**
 * A source of media assets.
 *
 * AssetSource represents an external asset provider, from which we license and download media for
 * use in videos.
 */
export abstract class AssetSource<AssetT extends Asset, AssetLicenseT extends AssetLicense> {
  /**
   * Returns the type of asset served by this source.
   */
  abstract getAssetType(): AssetType;

  /**
   * Returns the Zod schema for the type of asset served by this source.
   */
  abstract getAssetLicenseSchema(): z.ZodTypeAny;

  /**
   * Returns the Zod schema for the type of asset license used by this source.
   */
  abstract getAssetSchema(): z.ZodTypeAny;

  /**
   * Returns the S3 bucket this source uses to store local copies of assets.
   */
  abstract getS3Bucket(): string;

  /**
   * Returns the name of this asset source.
   */
  abstract getSourceName(): string;

  /**
   * Given a license and a base S3 key, return the full S3 key where our copy of the asset should be
   * stored.
   */
  abstract getS3Key(license: AssetLicenseT): string;

  /**
   * Given an asset and a base S3 key, return the full S3 key where our copy of the asset thumbnail
   * should be stored.
   */
  abstract getS3ThumbKey(asset: AssetT): string;

  /**
   * Builds an AssetToS3Request to download a licensed asset.
   */
  buildAssetToS3Request(license: AssetLicenseT, key: string): AssetToS3Request {
    return {
      url: license.sourceDownloadURL,
      bucket: this.getS3Bucket(),
      acl: 'public-read',
      key,
    };
  }

  buildAssetThumbToS3Request(asset: AssetT, key: string): AssetToS3Request {
    return {
      url: asset.thumbURL as string,
      bucket: this.getS3Bucket(),
      acl: 'public-read',
      key,
    };
  }

  /**
   * Downloads a licensed asset from the source.
   */
  async download(
    asset: AssetT,
    license: AssetLicenseT,
    timeout: number,
    force: boolean = false,
  ): Promise<AssetDownloadResponse> {
    const logger = getLogger({
      metadata: { service: 'AssetSource.download' },
    });

    logger.info('Downloading asset', { asset, license });

    // Check the (structural) validity of the asset license
    this.getAssetLicenseSchema().parse(license);

    const bucket = this.getS3Bucket();
    const key = this.getS3Key(license);
    const region = await getBucketRegion(bucket);

    // If we already have the asset in S3, skip the download.
    if (!force && (await doesFileExistInS3({ bucket, key }))) {
      logger.info('Skipping download of existing asset', { license, bucket, key });
      const assetDownloadResponse: AssetDownloadResponse = {
        asset,
        license,
        assetToS3Response: {
          bucket,
          key,
          // Tell me again how S3 is global and regions don't matter...
          url: constructS3URL({ bucket, key, region }),
        },
      };
      return assetDownloadResponse;
    }

    // OK, we don't have it, so get it.
    const { service: a2s3, connectionSource } = await this.getAssetToS3ServiceInfo();
    const fetchURL = new URL('fetch', a2s3.baseURL).toString();

    const a2s3Request = this.buildAssetToS3Request(license, key);

    try {
      const downloadTimer = new Timer(logger.configuration);

      const connection = await connectionSource.getSignedConnection();

      const response: AxiosResponse<AssetToS3Response> = await connection.request({
        method: 'POST',
        url: fetchURL,
        data: a2s3Request,
        signal: AbortSignal.timeout(timeout),
      });

      downloadTimer.debug('Downloaded asset', {
        assetLicense: license,
        response: response.data,
        timeout,
      });

      const assetDownloadResponse: AssetDownloadResponse = {
        asset,
        license,
        assetToS3Response: response.data,
      };

      return assetDownloadResponse;
    } catch (error) {
      logAxiosError({ logger, error, message: 'Download error' });
      throw new Error('Download error', { cause: error });
    }
  }

  async downloadThumb(
    asset: AssetT,
    timeout: number,
    force: boolean = false,
  ): Promise<AssetDownloadThumbResponse<AssetT>> {
    const logger = getLogger({
      metadata: { service: 'AssetSource.downloadThumb' },
    });

    logger.info('Downloading asset thumbnail', { asset });

    // Check the (structural) validity of the asset
    this.getAssetSchema().parse(asset);

    const bucket = this.getS3Bucket();
    const key = this.getS3ThumbKey(asset);
    const region = await getBucketRegion(bucket);

    // If we already have the thumbnail in S3, skip the download.
    if (!force && (await doesFileExistInS3({ bucket, key }))) {
      logger.info('Skipping download of existing asset thumbnail', { asset, bucket, key });
      const assetDownloadThumbResponse: AssetDownloadThumbResponse<AssetT> = {
        asset: asset,
        assetToS3Response: {
          bucket,
          key,
          // Tell me again how S3 is global and regions don't matter...
          url: constructS3URL({ bucket, key, region }),
        },
      };
      return assetDownloadThumbResponse;
    }

    // OK, we don't have it, so get it.
    const { service: a2s3, connectionSource } = await this.getAssetToS3ServiceInfo();
    const fetchURL = new URL('fetch', a2s3.baseURL).toString();

    const a2s3Request = this.buildAssetThumbToS3Request(asset, key);

    try {
      const downloadTimer = new Timer(logger.configuration);
      const connection = await connectionSource.getSignedConnection();

      const response: AxiosResponse<AssetToS3Response> = await connection.request({
        method: 'POST',
        url: fetchURL,
        data: a2s3Request,
        signal: AbortSignal.timeout(timeout),
      });

      downloadTimer.debug('Downloaded asset thumbnail', {
        asset,
        response: response.data,
      });

      const assetDownloadThumbResponse: AssetDownloadThumbResponse<AssetT> = {
        asset: asset,
        assetToS3Response: response.data,
      };

      return assetDownloadThumbResponse;
    } catch (error) {
      logAxiosError({ logger, error, message: 'Download error' });
      throw new Error('Download error', { cause: error });
    }
  }

  protected async getAssetToS3ServiceInfo() {
    const serviceAccessKey = getLocalServiceAccessKey();
    const serviceDiscovery = new ServiceDiscoverySDK(serviceAccessKey);
    const service = await serviceDiscovery.discoverService('AssetToS3');
    const connectionSource = new AxiosSignedConnectionSource(serviceAccessKey.identity);
    return { service, connectionSource };
  }
}
