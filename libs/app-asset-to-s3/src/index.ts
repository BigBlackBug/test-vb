import { ObjectCannedACL, S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod';

import { Timer, getLogger, logAxiosResponse } from 'libs/logging-ts';
import { AxiosSignedConnectionSource } from 'libs/service-access-lib';
import { getLocalServiceAccessKey } from 'libs/service-discovery-lib';
import { ServiceDiscoverySDK } from 'libs/service-discovery-sdk';
import { WaymarkServiceAccessKey } from 'libs/shared-types';
import {
  PartUploader,
  UploadAssetPartRequest,
  UploadedPart,
  copyURLToS3,
  multipartUpload,
} from 'libs/util-s3';

export const AssetToS3RequestSchema = z.object({
  url: z.string(),
  bucket: z.string(),
  key: z.string(),
  acl: z.string(),
  multipart: z.boolean().default(true),
});

export type AssetToS3Request = z.input<typeof AssetToS3RequestSchema>;

export const AssetToS3ResponseSchema = z.object({
  url: z.string(),
  bucket: z.string(),
  key: z.string(),
});

export type AssetToS3Response = z.infer<typeof AssetToS3ResponseSchema>;

export async function processAssetToS3Request(request: AssetToS3Request, timeout: number) {
  const partUploader = new LambdaPartUploader();
  await partUploader.setup();
  if (request.multipart) {
    return multipartUpload({
      url: request.url,
      bucket: request.bucket,
      key: request.key,
      uploader: partUploader,
      maxPartCount: Number.parseInt(process.env.MAX_PART_COUNT as string) || 10,
      deadline: Date.now() + timeout,
      acl: request.acl as ObjectCannedACL,
    });
  } else {
    return copyURLToS3({
      sourceURL: request.url,
      bucket: request.bucket,
      key: request.key,
      acl: request.acl,
    });
  }
}

async function getAssetToS3ServiceURL(
  serviceAccessKey: WaymarkServiceAccessKey,
  path: string,
): Promise<string> {
  const serviceDiscovery = new ServiceDiscoverySDK(serviceAccessKey);
  const serviceConfiguration = await serviceDiscovery.discoverService('AssetToS3');
  return new URL(path, serviceConfiguration.baseURL).toString();
}

class LambdaPartUploader implements PartUploader {
  serviceAccessKey: WaymarkServiceAccessKey | undefined;
  connectionSource: AxiosSignedConnectionSource | undefined;
  fetchPartURL: string | undefined;
  setupComplete = false;

  async setup() {
    if (this.setupComplete) {
      return;
    }

    const logger = getLogger({ metadata: { service: 'LambdaPartUploader.setup' } });
    const serviceAccessTimer = new Timer(logger.configuration);

    if (!this.serviceAccessKey) {
      this.serviceAccessKey = getLocalServiceAccessKey();
    }
    if (!this.fetchPartURL) {
      this.fetchPartURL = await getAssetToS3ServiceURL(this.serviceAccessKey, 'fetch-part');
    }
    if (!this.connectionSource) {
      this.connectionSource = new AxiosSignedConnectionSource(this.serviceAccessKey.identity);
    }

    this.setupComplete = true;

    serviceAccessTimer.info('LambdaPartUploader setup done', {
      serviceAccessKey: this.serviceAccessKey,
      fetchPartURL: this.fetchPartURL,
    });
  }

  async upload(client: S3Client, request: UploadAssetPartRequest): Promise<UploadedPart> {
    const logger = getLogger({ metadata: { service: 'LambdaPartUploader.upload' } });
    await this.setup();

    logger.info('Sending part to fetch-part', { request });

    if (!this.connectionSource || !this.fetchPartURL) {
      throw new Error(
        'LambdaPartUploader failed to set up connectionSource and fetchPartURL before upload',
      );
    }

    const connection = await this.connectionSource.getSignedConnection();

    const response = await connection.post(this.fetchPartURL, request);

    logAxiosResponse({ logger, message: 'fetch-part succeeded', response });

    return response.data;
  }
}
