import * as stream from 'stream';

import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3 } from 'aws-sdk';
import axios, { AxiosError } from 'axios';
import { PassThrough } from 'stream';

import { getLoggableError, getLogger, Timer } from 'libs/logging-ts';
import { S3Resource } from 'libs/shared-types';

export * from './multipart';

/**
 * Base options which all S3 upload methods use.
 */
interface BaseS3UploadOptions extends S3Resource {
  // The ACL (Access Control List) option defining who can access the uploaded file
  // (the main ones we'll be interested in are "private" and "public-read")
  acl?: S3.ObjectCannedACL;
  contentType?: string;
}

const DEFAULT_BUCKET_REGION = 'us-east-1';
const bucketRegionCache: { [key: string]: string } = {};

export async function getBucketRegion(bucket: string): Promise<string> {
  const logger = getLogger({ metadata: { service: 'util-s3/getBucketRegion' } });

  // Check the cache first so we can avoid unnecessary API calls.
  if (bucket in bucketRegionCache) {
    const region = bucketRegionCache[bucket];
    logger.debug('Found bucket in cache', { bucket, region });
    return region;
  }

  logger.debug('HEADing bucket', { bucket });

  // To set up the client we need to know if the bucket has a location constraint. If there is
  // a location constraint then the request needs to be constructed with the constraint as the
  // region, otherwise we need to use 'us-east-1' for buckets that don't have constraints. We
  // need to use axios because it's the HTTP headers that contain the region. High marks for
  // usability, AWS.
  const response = await axios
    .head(`https://${bucket}.s3.amazonaws.com`)
    .catch((error: Error | AxiosError) => {
      // If the bucket doesn't exist then we'll get a 404, and a 403 without permissions, but
      // we can still get the region from the response headers.
      if (axios.isAxiosError(error)) {
        const region = error.response?.headers?.['x-amz-bucket-region'] ?? DEFAULT_BUCKET_REGION;
        bucketRegionCache[bucket] = region;
        return region;
      }
    });

  if (typeof response === 'string') {
    logger.debug('HEAD response was string. Returning default bucket region.', {
      bucket,
      DEFAULT_BUCKET_REGION,
      response,
    });
    return DEFAULT_BUCKET_REGION;
  }

  const region = response?.headers['x-amz-bucket-region'];
  if (!region) {
    logger.debug('No region found in response. Returning default bucket region.', {
      bucket,
      DEFAULT_BUCKET_REGION,
      response,
    });
    return DEFAULT_BUCKET_REGION;
  }

  logger.debug('Bucket region found', { bucket, region });
  return region;
}

/**
 * Takes some file data and uploads it to S3.
 *
 * @param {Object}             options
 * @param {S3.Body}            options.fileData - The file data to upload (this can be a Buffer, a Stream, a Blob, etc)
 * @param {S3.ObjectKey}       options.key - Unique key string identifying the file;
 *                                            this is the name that the file will be saved with.
 * @param {S3.BucketName}      options.bucket - Name of the S3 bucket to upload to.
 * @param {S3.ObjectCannedACL} options.acl - The ACL (Access Control List) option to set for the uploaded file.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object with info about the uploaded file
 *                                once the upload has succeeded.
 */
export const uploadFileToS3 = async ({
  fileData,
  key,
  bucket,
  acl = 'private',
  contentType = 'application/octet-stream',
}: BaseS3UploadOptions & {
  fileData: S3.Body;
}): Promise<S3.ManagedUpload.SendData> => {
  const logger = getLogger({ metadata: { service: 'uploadFileToS3' } });
  // FIXME: convert to use aws-sdk v3
  const s3 = new S3();

  try {
    return s3
      .upload({
        Bucket: bucket,
        Key: key,
        Body: fileData,
        ACL: acl,
        ContentType: contentType,
      })
      .promise();
  } catch (e) {
    logger.error(`Error uploading file "${key}" to S3 bucket "${bucket}": ${getLoggableError(e)}`, {
      error: e,
    });

    // Re-throw the error
    throw e;
  }
};

/**
 * Takes a URL for a file that exists elsewhere and copies it to one of our S3 buckets.
 *
 * @param {Object}             options
 * @param {string}             options.sourceURL - The URL of the file to copy.
 * @param {S3.ObjectKey}       options.key - Unique key string identifying the file;
 *                                            this is the name that the file will be saved with.
 * @param {S3.BucketName}      options.bucket - Name of the S3 bucket to upload to.
 * @param {S3.ObjectCannedACL} options.acl - The ACL (Access Control List) option to set for the uploaded file.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object with info about the uploaded file
 *                                once the upload has succeeded.
 */
export const copyURLToS3 = async ({
  sourceURL,
  key,
  bucket,
  acl = 'private',
}: BaseS3UploadOptions & {
  sourceURL: string;
}): Promise<S3.ManagedUpload.SendData> => {
  const logger = getLogger({ metadata: { service: 'copyURLToS3' } });

  try {
    // Fetch the source URL as a stream
    const stream = await axios.get(sourceURL, { responseType: 'stream' });
    const contentType =
      (stream.headers && stream.headers['content-type']) || 'application/octet-stream';

    // Create a PassThrough stream so we can pipe the resource stream we're loading directly through to S3
    const passThrough = new PassThrough();
    const uploadPromise = uploadFileToS3({
      fileData: passThrough,
      key,
      bucket,
      acl,
      contentType,
    });

    // Pipe the response stream into the PassThrough stream to start uploading the source file
    // to S3
    stream.data.pipe(passThrough);

    return uploadPromise;
  } catch (e) {
    logger.error(
      `Error copying file at URL "${sourceURL}" to S3 bucket "${bucket}/${key}": ${getLoggableError(
        e,
      )}`,
      {
        error: e,
      },
    );

    // Re-throw the error
    throw e;
  }
};

/**
 * Tests if a file already exists in S3.
 *
 * @param {Object}             options
 * @param {S3.BucketName}      options.bucket - Name of the S3 bucket to upload to.
 * @param {S3.ObjectKey}       options.key - Unique key string identifying the file;
 *                                           this is the name that the file will be saved with.
 *
 * @returns {Promise<boolean>} - A promise that resolves to true if the file exists, false otherwise.
 */
export const doesFileExistInS3 = async ({ bucket, key }: S3Resource): Promise<boolean> => {
  const logger = getLogger({ metadata: { service: 'doesFileExistInS3' } });
  const s3 = new S3();

  try {
    // If this succeeds then there is a file at the given key.
    await s3
      .headObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();

    return true;
  } catch (e: any) {
    // Failures of the 404 persuasion can be treated as "does not exist"
    if (e.code === 'NotFound') {
      return false;
    }

    logger.error(
      `Error checking for existence of file "${key}" in S3 bucket "${bucket}": ${getLoggableError(
        e,
      )}`,
      {
        error: e,
      },
    );

    // Re-throw the error
    throw e;
  }
};

/**
 * Constructs an S3 dynamic-style URL.
 */
export const constructS3URL = (resource: S3Resource) => {
  return new URL(
    `https://${resource.bucket}.s3.${resource.region}.amazonaws.com/${resource.key}`,
  ).toString();
};

/**
 * Information needed to presign an S3 PutObject URL.
 */
export interface GetPresignedPutUrlRequest {
  bucket: string;
  key: string;
  fileType?: string;
  expiration?: number;
  acl?: ObjectCannedACL;
}

/**
 * Gets a presigned URL that will allow PUTting an object into S3.
 *
 * The entity creating a presigned URL must have the permissions required to carry out the requested
 * action. See:
 *
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html#who-presigned-url
 *
 * This means that if you're creating presigned URLs in a Lambda function, it needs to have policies
 * permitting the URL's intended action. In a SAM template, this likely means you need one or more
 * of S3CrudPolicy, S3ReadPolicy, and S3WritePolicy. See:
 *
 * https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-template-list.html#s3-read-policy
 */
export async function getPresignedPutUrl(request: GetPresignedPutUrlRequest): Promise<string> {
  const client = new S3Client({ region: process.env.AWS_REGION });
  const command = new PutObjectCommand({
    Bucket: request.bucket,
    Key: request.key,
    // We must pass the same content type and ACL header here as in the PUT request
    // from the browser or the signed URL upload will fail with permission denied
    ContentType: request.fileType,
    ACL: request.acl,
  });
  const signedURL = await getSignedUrl(client, command, { expiresIn: request.expiration ?? 3600 });
  return signedURL;
}

export async function readObject(stream: stream.Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function downloadS3Resource(resource: S3Resource): Promise<Buffer> {
  const timer = new Timer({ metadata: { service: 'util-s3/downloadS3Resource' } });
  const client = new S3Client({ region: resource.region || process.env.AWS_REGION });
  const output = await client.send(
    new GetObjectCommand({
      Bucket: resource.bucket,
      Key: resource.key,
    }),
  );
  const objectBuffer = await readObject(output.Body as stream.Readable);

  timer.debug('downloadS3Resource finished');

  return objectBuffer;
}

/**
 * Delete a file from S3.
 *
 * @param {Object}             options
 * @param {S3.BucketName}      options.bucket - Name of the S3 bucket the object is in
 * @param {S3.ObjectKey}       options.key - Unique key string identifying the file to delete
 *
 * @returns {Promise<boolean>} - A promise that resolves to true if the file was deleted, false otherwise.
 */
export const deleteFileFromS3 = async ({ bucket, key }: S3Resource): Promise<boolean> => {
  const region = await getBucketRegion(bucket);

  const logger = getLogger({
    metadata: { service: 'deleteFileFromS3', bucket, key, region },
  });

  logger.debug('Attempting to delete file from S3');
  const client = new S3Client({ region });

  try {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    const response: DeleteObjectCommandOutput = await client.send(command);

    if (response.$metadata.httpStatusCode === 204) {
      logger.info('File deleted successfully');
      return true;
    } else {
      logger.error('Failed to delete file:', { response });
      return false;
    }
  } catch (e: any) {
    // Failures of the 404 persuasion can be treated as "does not exist"
    if (e.name === 'NoSuchKey' || e.name === 'NotFound') {
      return false;
    }

    logger.error('Error deleting file from S3 bucket', {
      error: e,
      endpoint: e.endpoint,
    });

    // Re-throw the error
    throw e;
  }
};
