import axios, { AxiosResponse } from 'axios';

import { getLogger, logAxiosError, logAxiosResponse } from 'libs/logging-ts';

import {
  AssetLicenseResponse,
  AssetIDStore,
  AssetSearchResponse,
  LicenseVideoRequest,
  LicenseVideoRequestVideo,
  Video,
  VideoAssetLicense,
  VideoAssetSource,
  AssetIDStoreItem,
  AssetLicensePurpose,
} from 'libs/media-asset-management-ts';

import { SHUTTERSTOCK_SOURCE_NAME, getShutterstockAPIConfiguration } from '../configuration';
import { buildShutterstockAPIURL } from '../request';
import { ShutterstockLicenseVideoResponse, buildShutterstockLicenseVideoRequests } from './license';
import {
  ShutterstockVideoSearchResponse,
  VideoSearchQueryParameters,
  buildShutterstockVideoSearchURL,
} from './search';
import {
  ShutterstockVideoCategoriesResponse,
  VideoCategoriesQueryParameters,
  buildShutterstockVideoCategoriesURL,
} from './category';

export class ShutterstockVideoAssetSource extends VideoAssetSource {
  constructor(public assetIDStore: AssetIDStore) {
    super(assetIDStore);
  }

  getSourceName(): string {
    return SHUTTERSTOCK_SOURCE_NAME;
  }

  async categories(
    queryParameters: VideoCategoriesQueryParameters,
    timeout: number,
  ): Promise<ShutterstockVideoCategoriesResponse> {
    const logger = getLogger({
      metadata: { service: 'ShutterstockVideoAssetSource.categories' },
    });

    let configuration;

    try {
      configuration = await getShutterstockAPIConfiguration();
    } catch (error) {
      logger.error('Could not get configuration', { error });
      throw new Error('Service is not available');
    }

    const apiToken = configuration?.video?.preview?.apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks video preview API token');
      throw new Error('Service is not available');
    }

    const url = buildShutterstockVideoCategoriesURL(queryParameters, configuration);

    logger.debug('Built Shutterstock video categories URL', { url, queryParameters });

    const shutterstockResponse = await axios.request({
      url: url.toString(),
      method: 'GET',
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(timeout),
    });

    logAxiosResponse({ logger, message: 'Shutterstock response', response: shutterstockResponse });

    return shutterstockResponse.data;
  }

  async license(
    licenseVideoRequest: LicenseVideoRequest,
    timeout: number,
  ): Promise<AssetLicenseResponse<VideoAssetLicense>> {
    const logger = getLogger({
      metadata: { service: 'ShutterstockVideoAssetSource.license' },
    });

    logger.info(`Received Shutterstock video license request`, { request: licenseVideoRequest });

    let configuration;

    try {
      configuration = await getShutterstockAPIConfiguration();
    } catch (error) {
      logger.error('Could not get configuration', { error });
      throw new Error('Service is not available');
    }

    // Theoretically we could group them by purpose and submit the various requests, but I can't
    // think of a reason we'd need to, so for now we'll just reject a mix of license purposes.
    const purposes = new Set<AssetLicensePurpose>(licenseVideoRequest.videos.map((v) => v.purpose));
    if (purposes.size != 1) {
      throw new Error('All videos must be licensed for the same purpose.');
    }

    const purpose =
      (purposes.values().next().value as AssetLicensePurpose) === AssetLicensePurpose.Render
        ? AssetLicensePurpose.Render
        : AssetLicensePurpose.Preview;

    const apiToken = configuration.video[purpose].apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks API token for licensing videos with purpose', { purpose });
      throw new Error('Service is not available');
    }

    logger.debug('Processing license video request', { licenseVideoRequest });

    const url = buildShutterstockAPIURL('/v2/videos/licenses', configuration);

    logger.debug('Built Shutterstock video licensing URL', { url, licenseVideoRequest });

    const shutterstockLicenseRequests = buildShutterstockLicenseVideoRequests(
      configuration,
      licenseVideoRequest,
    );

    const shutterstockResponses = await Promise.all(
      shutterstockLicenseRequests.map(
        async (shutterstockLicenseRequest, i, shutterstockLicenseRequests) => {
          const shutterstockLicenseRequestNumber = i + 1;
          logger.debug(
            `Sending Shutterstock license request ${shutterstockLicenseRequestNumber}/${shutterstockLicenseRequests.length}`,
            {
              shutterstockLicenseRequest,
              shutterstockLicenseRequestNumber,
              shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
              requestAssetCount: shutterstockLicenseRequest.videos.length,
            },
          );

          try {
            const shutterstockResponse: AxiosResponse<ShutterstockLicenseVideoResponse> =
              await axios.request({
                url: url.toString(),
                method: 'POST',
                headers: { Authorization: `Bearer ${apiToken}` },
                signal: AbortSignal.timeout(timeout),
                data: shutterstockLicenseRequest,
              });

            if (shutterstockResponse.data.errors) {
              logger.error('Error licensing videos', {
                shutterstockLicenseRequest,
                shutterstockLicenseRequestNumber,
                shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
                requestAssetCount: shutterstockLicenseRequest.videos.length,
                shutterstockResponse: shutterstockResponse.data,
              });
              throw new Error('Error licensing videos');
            }

            logAxiosResponse({
              logger,
              message: `Shutterstock response ${shutterstockLicenseRequestNumber}/${shutterstockLicenseRequests.length}`,
              response: shutterstockResponse,
              metadata: {
                shutterstockLicenseRequest,
                shutterstockLicenseRequestNumber,
                shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
                requestAssetCount: shutterstockLicenseRequest.videos.length,
              },
            });

            return shutterstockResponse.data;
          } catch (error) {
            logAxiosError({
              error,
              logger,
              message: 'Error from Shutterstock video license request',
              metadata: {
                shutterstockLicenseRequest,
                shutterstockLicenseRequestNumber,
                shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
                requestAssetCount: shutterstockLicenseRequest.videos.length,
              },
            });
          }
        },
      ),
    );

    const response = this.transformShutterstockVideoLicenseResponse(
      licenseVideoRequest,
      shutterstockResponses.filter((r) => Boolean(r)) as ShutterstockLicenseVideoResponse[],
    );

    // Record a local asset ID for all the licensed assets.
    for (const license of response.assetLicenses) {
      logger.debug('Recording asset license', { license });
      let existingRecord: AssetIDStoreItem | null = null;
      try {
        existingRecord = await this.assetIDStore.retrieve(license);
      } catch (error) {
        logger.debug('Could not find existing record of licensed asset', { license });
      }
      const assetID = existingRecord?.assetID || this.generateAssetID();
      license.assetID = assetID;
      await this.assetIDStore.store(license, assetID);
    }

    return response;
  }

  async search(
    searchParameters: VideoSearchQueryParameters,
    timeout: number,
  ): Promise<AssetSearchResponse<Video>> {
    const logger = getLogger({
      metadata: { service: 'ShutterstockVideoAssetSource.search' },
    });

    let configuration;

    try {
      configuration = await getShutterstockAPIConfiguration();
    } catch (error) {
      logger.error('Could not get configuration', { error });
      throw new Error('Service is not available');
    }

    const apiToken = configuration?.video?.preview?.apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks video preview API token');
      throw new Error('Service is not available');
    }

    const url = buildShutterstockVideoSearchURL(searchParameters, configuration);

    logger.debug('Built Shutterstock video search URL', { url, searchParameters });

    const shutterstockResponse = await axios.request({
      url: url.toString(),
      method: 'GET',
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(timeout),
    });

    logAxiosResponse({ logger, message: 'Shutterstock response', response: shutterstockResponse });

    return this.transformShutterstockVideoSearchResponse(shutterstockResponse.data);
  }

  transformShutterstockVideoLicenseResponse(
    licenseVideoRequest: LicenseVideoRequest,
    responses: ShutterstockLicenseVideoResponse[],
  ): AssetLicenseResponse<VideoAssetLicense> {
    // build a lookup table of source asset ID to video
    const videoMap = new Map<string, LicenseVideoRequestVideo>();
    for (const video of licenseVideoRequest.videos) {
      videoMap.set(video.source_asset_id, video);
    }

    // Create our response
    const result: AssetLicenseResponse<VideoAssetLicense> = {
      assetLicenses: [] as VideoAssetLicense[],
    };

    // Add each license from every Shutterstock response to our response
    for (const response of responses) {
      for (const license of response.data) {
        const video = videoMap.get(license.video_id);

        if (video) {
          result.assetLicenses.push({
            assetType: this.getAssetType(),
            licensee: video.account_id,
            purpose: video.purpose,
            size: video.size,
            source: this.getSourceName(),
            sourceAssetID: license.video_id,
            sourceDownloadURL: license.download.url,
            sourceLicenseID: license.license_id,
          } as VideoAssetLicense);
        }
      }
    }
    return result;
  }

  transformShutterstockVideoSearchResponse(
    response: ShutterstockVideoSearchResponse,
  ): AssetSearchResponse<Video> {
    const logger = getLogger({
      metadata: {
        service: 'ShutterstockVideoAssetSource.transformShutterstockVideoSearchResponse',
      },
    });

    logger.debug('transforming response', { response });

    const result = {
      search_id: response.search_id,
      page: response.page,
      per_page: response.per_page,
      page_count: response.data.length,
      total_count: response.total_count,
      assets: [] as Video[],
    };
    for (const video of response.data) {
      result.assets.push({
        aspect_ratio: video.aspect_ratio,
        categories: video.categories.map((sourceCategory) => {
          return {
            source: this.getSourceName(),
            sourceCategoryID: sourceCategory.id,
            sourceCategoryName: sourceCategory.name,
          };
        }),
        description: video.description,
        fileSize: video.assets.hd?.file_size ?? 0,
        height: video.assets.hd?.height ?? 0,
        keywords: video.keywords,
        length: video.duration,
        previewURL: video.assets.thumb_mp4?.url ?? null,
        searchID: response.search_id,
        source: this.getSourceName(),
        sourceAssetID: video.id,
        thumbURL: video.assets.thumb_jpg?.url ?? null,
        width: video.assets.hd?.width ?? 0,
      });
    }
    return result;
  }
}
