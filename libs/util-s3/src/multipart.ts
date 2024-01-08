import axios, { AxiosRequestConfig } from 'axios';
import { AbortController } from '@aws-sdk/abort-controller';
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadCommandOutput,
  CreateMultipartUploadCommand,
  CreateMultipartUploadCommandOutput,
  ObjectCannedACL,
  S3Client,
  UploadPartCommand,
  UploadPartCommandOutput,
} from '@aws-sdk/client-s3';

import { Timer, getLogger, logAxiosError } from 'libs/logging-ts';
import { getBucketRegion } from '.';

/**
 * The size and number of parts in a multipart upload.
 */
interface MultipartDimensions {
  partCount: number;
  partSize: number;
  lastPartSize: number;
}

/**
 * A single part of a multipart upload.
 */
export interface UploadPart {
  url: string;
  partNumber: number;
  partSize: number;
  rangeStart: number;
  rangeEnd: number;
}

/**
 * A collection of calculations for a multipart upload.
 */
interface MultipartPlan {
  contentType: string;
  dimensions: MultipartDimensions;
  parts: UploadPart[];
}

/**
 * The result of the upload of a single part.
 */
export interface UploadedPart {
  part: UploadPart;
  result: UploadPartCommandOutput;
}

/**
 * A request to upload a single part.
 */
export interface UploadAssetPartRequest {
  upload: CreateMultipartUploadCommandOutput;
  part: UploadPart;
}

/**
 * An interface that allows for different ways to upload each part.
 */
export interface PartUploader {
  upload(
    client: S3Client,
    request: UploadAssetPartRequest,
    deadline?: number,
  ): Promise<UploadedPart>;
}

/**
 * Given information about a resource, calculate the parts of a multipart upload.
 */
export function planUploadParts(url: string, dimensions: MultipartDimensions): UploadPart[] {
  const parts: UploadPart[] = [];
  for (let partNumber = 1; partNumber <= dimensions.partCount; partNumber++) {
    const partSize =
      partNumber === dimensions.partCount ? dimensions.lastPartSize : dimensions.partSize;
    const rangeStart = (partNumber - 1) * dimensions.partSize;
    const rangeEnd = rangeStart + partSize - 1;
    parts.push({ url, partNumber, partSize, rangeStart, rangeEnd });
  }
  return parts;
}

/**
 * Examines a resource via a HEAD request, then plans a multipart upload to S3 for it.
 */
export async function planMultipartUpload(
  url: string,
  maxPartCount: number = 10,
): Promise<MultipartPlan> {
  const logger = getLogger({
    metadata: { service: 'util-s3/multipart/planMultipartUpload' },
  });
  const response = await axios.request({
    method: 'HEAD',
    url: url,
  });
  logger.debug('Received HEAD response', {
    url,
    response: { config: response.config, headers: response.headers },
  });

  const contentType = response.headers['content-type'];
  const size = Number.parseInt(response.headers['content-length']);

  // S3 multipart upload parts can't be smaller than five megabytes.
  const minPartSize = 5 * 1024 * 1024;
  // S3's UploadPart maximum part number is 10000.
  const partCount = Math.min(
    maxPartCount,
    Math.max(1, Math.min(10000, Math.ceil(size / minPartSize))),
  );
  const partSize = Math.max(Math.ceil(size / partCount), minPartSize);
  const lastPartSize = size - (partCount - 1) * partSize;

  const parts = planUploadParts(url, { partCount, partSize, lastPartSize });

  return { contentType, dimensions: { partCount, partSize, lastPartSize }, parts };
}

/**
 * Streams a URL to S3 as part of a multipart upload.
 */
export async function uploadPart(
  client: S3Client,
  request: UploadAssetPartRequest,
  deadline?: number,
  maxAttempts?: number,
) {
  const logger = getLogger({
    metadata: { service: 'util-s3/multipart/uploadPart' },
  });

  const streamTimer = new Timer(logger.configuration);

  const { part, upload } = request;

  const axiosOptions: AxiosRequestConfig = {
    method: 'GET',
    url: part.url,
    headers: {
      Range: `bytes=${part.rangeStart}-${part.rangeEnd}`,
    },
    responseType: 'stream',
  };

  if (deadline && deadline > 0) {
    axiosOptions.signal = AbortSignal.timeout(Math.max(1, deadline - Date.now()));
  }

  let attempt = 0;
  maxAttempts ||= 10;
  logger.info('Entering upload loop', { maxAttempts, deadline, now: Date.now(), request });
  while (attempt < maxAttempts && deadline ? Date.now() < deadline : true) {
    attempt++;

    logger.info('Starting stream', { attempt, request, axiosOptions });

    try {
      const streamingResponse = await axios.request(axiosOptions);
      const uploadPartCommand = new UploadPartCommand({
        Body: streamingResponse.data,
        Bucket: upload.Bucket,
        Key: upload.Key,
        ContentLength: part.partSize,
        UploadId: upload.UploadId,
        PartNumber: part.partNumber,
      });

      const abortController = new AbortController();

      let timeout: NodeJS.Timeout | undefined;

      if (deadline) {
        timeout = setTimeout(() => {
          abortController.abort();
        }, deadline - Date.now());
      }

      const result = await client.send(uploadPartCommand, { abortSignal: abortController.signal });

      streamTimer.info('Part uploaded', { attempt, part, upload, result });

      clearTimeout(timeout);

      return {
        part: part,
        result: result,
      };
    } catch (error) {
      if (deadline && Date.now() >= deadline) {
        throw error;
      }

      logAxiosError({
        error,
        logger,
        message: 'uploadPart failed; retrying',
        metadata: { attempt, axiosOptions, part, upload },
      });
    }
  }

  throw new Error('uploadPart timed out');
}

/**
 * An in-process part uploader using Axios.
 */
class AxiosPartUploader implements PartUploader {
  async upload(
    client: S3Client,
    request: UploadAssetPartRequest,
    deadline?: number,
  ): Promise<UploadedPart> {
    return uploadPart(client, request, deadline);
  }
}

export interface MultipartUploadOptions {
  url: string;
  bucket: string;
  key: string;
  uploader?: PartUploader;
  maxPartCount?: number;
  deadline?: number;
  acl?: ObjectCannedACL;
}

/**
 * Stream a resource from its source URL to S3.
 *
 * Executes an S3 multipart upload with asynchronous upload of each part.
 */
export async function multipartUpload({
  url,
  bucket,
  key,
  uploader = new AxiosPartUploader(),
  maxPartCount = 10,
  deadline,
  acl,
}: MultipartUploadOptions): Promise<CompleteMultipartUploadCommandOutput> {
  const logger = getLogger({
    metadata: { service: 'util-s3/multipart/upload' },
  });

  const plan = await planMultipartUpload(url, maxPartCount);

  logger.info('Planned multipart S3 upload', { plan });

  const client = new S3Client({ region: await getBucketRegion(bucket) });

  const createMultipartUploadCommand = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: plan.contentType,
    ACL: acl,
  });

  logger.info('Creating multipart S3 upload', { command: createMultipartUploadCommand });

  const upload = await client.send(createMultipartUploadCommand);

  logger.info('Uploading parts to S3', { parts: plan.parts, upload });

  try {
    const uploadedParts = await Promise.all(
      plan.parts.map((part) => {
        const request: UploadAssetPartRequest = {
          upload,
          part,
        };
        return uploader.upload(client, request, deadline);
      }),
    );

    const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
      Bucket: upload.Bucket,
      Key: upload.Key,
      UploadId: upload.UploadId,
      MultipartUpload: {
        Parts: uploadedParts.map((uploadedPart) => {
          logger.debug('uploadedPart', { uploadedPart });
          return { PartNumber: uploadedPart.part.partNumber, ETag: uploadedPart.result.ETag };
        }),
      },
    });
    logger.info('Completing multipart S3 upload', { command: completeMultipartUploadCommand });

    return await client.send(completeMultipartUploadCommand);
  } catch (error) {
    logAxiosError({ logger, message: 'Multipart S3 upload failed', error });
    const abortMultipartUploadCommand = new AbortMultipartUploadCommand({
      Bucket: upload.Bucket,
      Key: upload.Key,
      UploadId: upload.UploadId,
    });
    await client.send(abortMultipartUploadCommand);
    throw error;
  }
}
