import { customAlphabet } from 'nanoid';
import { nolookalikes } from 'nanoid-dictionary';
import { ZodTypeAny, z } from 'zod';

import { getLogger } from 'libs/logging-ts';
import { uploadFileToS3 } from 'libs/util-s3';
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

export enum VideoSize {
  FourK = '4k',
  HighDefinition = 'hd',
  StandardDefinition = 'sd',
  Web = 'web',
}

/**
 * Our representation of a video asset.
 */
export const VideoSchema = AssetSchema.extend({
  aspect_ratio: z.string(),
  height: z.number(),
  length: z.number(),
  width: z.number(),
  vpsKey: z.optional(z.string()),
});
export type Video = z.infer<typeof VideoSchema>;

export const VideoAssetLicenseSchema = AssetLicenseSchema.extend({
  assetType: z.literal(AssetType.Video), // restriction of the allowed asset types requires this literal conversion :^(
  size: z.nativeEnum(VideoSize),
});
export type VideoAssetLicense = z.infer<typeof VideoAssetLicenseSchema>;

/**
 * The schema for individual videos sent in license requests to this service.
 */
export const LicenseVideoRequestVideoSchema = z.object({
  account_id: z.string(),
  source_asset_id: z.string(),
  purpose: z.nativeEnum(AssetLicensePurpose),
  size: z.nativeEnum(VideoSize),
  source_search_id: z.string(),
});

export type LicenseVideoRequestVideo = z.infer<typeof LicenseVideoRequestVideoSchema>;

/**
 * The schema for license requests to this service.
 */
export const LicenseVideoRequestSchema = z.object({
  videos: z.array(LicenseVideoRequestVideoSchema),
});

export type LicenseVideoRequest = z.infer<typeof LicenseVideoRequestSchema>;

export const VideoAssetDownloadRequestSchema = AssetDownloadRequestSchema.extend({
  asset: VideoSchema,
  license: VideoAssetLicenseSchema,
});

export type VideoAssetDownloadRequest = z.infer<typeof VideoAssetDownloadRequestSchema>;

export const VideoAssetDownloadResponseSchema = AssetDownloadResponseSchema.extend({
  asset: VideoSchema,
  license: VideoAssetLicenseSchema,
});

export type VideoAssetDownloadResponse = z.infer<typeof VideoAssetDownloadResponseSchema>;

export abstract class VideoAssetSource extends AssetSource<Video, VideoAssetLicense> {
  protected assetIDStore: AssetIDStore;

  constructor(assetIDStore: AssetIDStore) {
    super();
    this.assetIDStore = assetIDStore;
  }

  /**
   * Create a file containing video metadata the renderer needs to use the raw preview video.
   */
  async createRawPreviewMetadata(video: Video) {
    const logger = getLogger({
      metadata: {
        service: 'VideoAssetSource.createRawPreviewMetadata',
      },
    });

    const metadata = {
      height: video.height,
      width: video.width,
      duration: video.length,
    };

    const bucket = this.getS3Bucket();
    const key = `videos/processed/raw_preview/${video.vpsKey}/metadata.json`;

    logger.debug('Creating raw preview metadata file', { metadata, key, bucket, video });

    await uploadFileToS3({
      fileData: Buffer.from(JSON.stringify(metadata, null, 2)),
      key,
      bucket,
      acl: 'public-read',
    });
  }

  async download(
    asset: Video,
    license: VideoAssetLicense,
    timeout: number,
    force: boolean = false,
  ): Promise<VideoAssetDownloadResponse> {
    const assetDownloadResponse = await super.download(asset, license, timeout, force);

    /**
     * When downloading raw preview videos, we need to fabricate the metadata needed by the renderer.
     */
    if (license.purpose === AssetLicensePurpose.RawPreview) {
      await this.createRawPreviewMetadata(asset);
    }

    return {
      asset,
      license,
      assetToS3Response: assetDownloadResponse.assetToS3Response,
    } as VideoAssetDownloadResponse;
  }

  /**
   * Generates a VPS key as a video asset ID.
   */
  generateAssetID() {
    return `${Math.floor(Date.now())}_${customAlphabet(nolookalikes, 10)()}`;
  }

  getAssetLicenseSchema(): ZodTypeAny {
    return VideoAssetLicenseSchema;
  }

  getAssetSchema(): ZodTypeAny {
    return VideoSchema;
  }

  getAssetType() {
    return AssetType.Video;
  }

  getS3Bucket() {
    return process.env.VPS_BUCKET || 'wm-vps-development';
  }

  getS3Key(license: AssetLicense) {
    const baseKey = license.assetID; // VPS key
    return license.purpose == AssetLicensePurpose.RawPreview
      ? `videos/processed/raw_preview/${baseKey}/${baseKey}.mp4`
      : `videos/source/${baseKey}`;
  }

  getS3ThumbKey(video: Video) {
    return `videos/processed/tenThumbnails_jpg300/${video.vpsKey}/thumbnail_02.jpg`;
  }
}
