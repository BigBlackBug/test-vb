import axios, { AxiosResponse } from 'axios';
import _ from 'lodash';

import { getLogger, logAxiosError, logAxiosResponse } from 'libs/logging-ts';
import {
  AssetIDStoreItem,
  AssetLicensePurpose,
  AssetLicenseResponse,
  AssetSearchResponse,
  Image,
  ImageAssetLicense,
  ImageAssetSource,
  LicenseImageRequest,
  LicenseImageRequestImage,
} from 'libs/media-asset-management-ts';

import {
  SHUTTERSTOCK_SOURCE_NAME,
  ShutterstockAPIConfiguration,
  getShutterstockAPIConfiguration,
} from '../configuration';
import {
  ImageSearchQueryParametersInput,
  ShutterstockImageSearchResponse,
  buildShutterstockImageSearchURL,
} from './search';
import { buildShutterstockAPIURL } from '../request';
import { ShutterstockLicenseImageResponse, buildShutterstockLicenseImageRequests } from './license';
import {
  ImageCategoriesQueryParameters,
  ShutterstockImageCategoriesResponse,
  buildShutterstockImageCategoriesURL,
} from './category';
import { ShutterstockImageDetailResponse, buildShutterstockImageDetailURL } from './detail';

export class ShutterstockImageAssetSource extends ImageAssetSource {
  getSourceName(): string {
    return SHUTTERSTOCK_SOURCE_NAME;
  }

  async categories(
    queryParameters: ImageCategoriesQueryParameters,
    timeout: number,
  ): Promise<ShutterstockImageCategoriesResponse> {
    const logger = getLogger({
      metadata: { service: 'ShutterstockImageAssetSource.categories' },
    });

    let configuration;

    try {
      configuration = await getShutterstockAPIConfiguration();
    } catch (error) {
      logger.error('Could not get configuration', { error });
      throw new Error('Service is not available');
    }

    const apiToken = configuration?.image?.preview?.apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks image preview API token');
      throw new Error('Service is not available');
    }

    const url = buildShutterstockImageCategoriesURL(queryParameters, configuration);

    logger.debug('Built Shutterstock image categories URL', { url, queryParameters });

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
    licenseImageRequest: LicenseImageRequest,
    timeout: number,
  ): Promise<AssetLicenseResponse<ImageAssetLicense>> {
    const logger = getLogger({
      metadata: { service: 'ShutterstockImageAssetSource.license' },
    });

    logger.info(`Processing Shutterstock image license request`, { licenseImageRequest });

    let configuration;

    try {
      configuration = await getShutterstockAPIConfiguration();
    } catch (error) {
      logger.error('Could not get configuration', { error });
      throw new Error('Service is not available');
    }

    // Theoretically we could group them by purpose and submit the various requests, but I can't
    // think of a reason we'd need to, so for now we'll just reject a mix of license purposes.
    const purposes = new Set<AssetLicensePurpose>(licenseImageRequest.images.map((v) => v.purpose));
    if (purposes.size != 1) {
      throw new Error('All images must be licensed for the same purpose.');
    }

    const purpose =
      (purposes.values().next().value as AssetLicensePurpose) === AssetLicensePurpose.Render
        ? AssetLicensePurpose.Render
        : AssetLicensePurpose.Preview;

    const apiToken = configuration.image[purpose].apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks API token for licensing images with purpose', { purpose });
      throw new Error('Service is not available');
    }

    logger.debug('got license image request', { licenseImageRequest });

    const url = buildShutterstockAPIURL('/v2/images/licenses', configuration);

    logger.debug('Built Shutterstock image licensing URL', { url });

    const shutterstockLicenseRequests = buildShutterstockLicenseImageRequests(
      configuration,
      licenseImageRequest,
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
              requestAssetCount: shutterstockLicenseRequest.images.length,
            },
          );

          try {
            const shutterstockResponse: AxiosResponse<ShutterstockLicenseImageResponse> =
              await axios.request({
                url: url.toString(),
                method: 'POST',
                headers: { Authorization: `Bearer ${apiToken}` },
                signal: AbortSignal.timeout(timeout),
                data: shutterstockLicenseRequest,
              });

            if (shutterstockResponse.data.errors) {
              logger.error('Error licensing images', {
                shutterstockLicenseRequest,
                shutterstockLicenseRequestNumber,
                shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
                requestAssetCount: shutterstockLicenseRequest.images.length,
                shutterstockResponse: shutterstockResponse.data,
              });
              throw new Error('Error licensing images');
            }

            logAxiosResponse({
              logger,
              message: `Shutterstock response ${shutterstockLicenseRequestNumber}/${shutterstockLicenseRequests.length}`,
              response: shutterstockResponse,
              metadata: {
                shutterstockLicenseRequest,
                shutterstockLicenseRequestNumber,
                shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
                requestAssetCount: shutterstockLicenseRequest.images.length,
              },
            });

            return shutterstockResponse.data;
          } catch (error) {
            logAxiosError({
              error,
              logger,
              message: 'Error from Shutterstock image license request',
              metadata: {
                shutterstockLicenseRequest,
                shutterstockLicenseRequestNumber,
                shutterstockLicenseRequestCount: shutterstockLicenseRequests.length,
                requestAssetCount: shutterstockLicenseRequest.images.length,
              },
            });
          }
        },
      ),
    );

    const response = this.transformShutterstockImageLicenseResponse(
      licenseImageRequest,
      shutterstockResponses.filter(Boolean) as ShutterstockLicenseImageResponse[],
    );

    // Record a local asset ID for all the licensed assets.
    await Promise.all(
      response.assetLicenses.map(async (license) => {
        logger.debug('Recording asset license', { license });
        let existingRecord: AssetIDStoreItem | null = null;
        try {
          existingRecord = await this.assetIDStore.retrieve(license);
        } catch (error) {
          logger.debug('Could not find existing record of licensed asset', { license });
        }
        const assetID = existingRecord?.assetID || this.generateAssetID(license);
        license.assetID = assetID;
        await this.assetIDStore.store(license, assetID);
      }),
    );

    return response;
  }

  async search(
    searchParameters: ImageSearchQueryParametersInput,
    timeout: number,
  ): Promise<AssetSearchResponse<Image>> {
    const deadline = Date.now() + timeout;
    const logger = getLogger({
      metadata: { service: 'ShutterstockImageAssetSource.search' },
    });
    let configuration;

    try {
      configuration = await getShutterstockAPIConfiguration();
    } catch (error) {
      logger.error('Could not get configuration', { error });
      throw new Error('Service is not available');
    }

    const apiToken = configuration?.image?.preview?.apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks image preview API token');
      throw new Error('Service is not available');
    }

    const url = buildShutterstockImageSearchURL(searchParameters, configuration);

    logger.debug('Built Shutterstock image search URL', { url, searchParameters });

    const shutterstockResponse = await axios.request({
      url: url.toString(),
      method: 'GET',
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(deadline - Date.now()),
    });

    logAxiosResponse({ logger, message: 'Shutterstock response', response: shutterstockResponse });

    return await this.transformShutterstockImageSearchResponse(
      shutterstockResponse.data,
      configuration,
      deadline - Date.now(),
    );
  }

  transformShutterstockImageLicenseResponse(
    licenseImageRequest: LicenseImageRequest,
    responses: ShutterstockLicenseImageResponse[],
  ): AssetLicenseResponse<ImageAssetLicense> {
    // build a lookup table of source asset ID to image
    const imageMap = new Map<string, LicenseImageRequestImage>();
    for (const image of licenseImageRequest.images) {
      imageMap.set(image.source_asset_id, image);
    }

    // Create our response
    const result: AssetLicenseResponse<ImageAssetLicense> = {
      assetLicenses: [] as ImageAssetLicense[],
    };

    // Add each license from every Shutterstock response to our response
    for (const response of responses) {
      for (const license of response.data) {
        const image = imageMap.get(license.image_id);

        if (image) {
          result.assetLicenses.push({
            assetType: this.getAssetType(),
            licensee: image.account_id,
            purpose: image.purpose,
            source: this.getSourceName(),
            sourceAssetID: license.image_id,
            sourceDownloadURL: license.download.url,
            sourceLicenseID: license.license_id,
          } as ImageAssetLicense);
        }
      }
    }
    return result;
  }

  async getMosaicThumbnails(
    response: ShutterstockImageSearchResponse,
    configuration: ShutterstockAPIConfiguration,
    timeout: number,
  ): Promise<Map<string, string>> {
    const logger = getLogger({
      metadata: { service: 'ShutterstockImageAssetSource.getMosaicThumbnails' },
    });

    const mosaicThumbnailMap = new Map<string, string>();
    if (!response.data || response.data.length < 1) {
      logger.warn('No images in search response, so not getting thumbnails', response);
      return mosaicThumbnailMap;
    }

    const detailQueryParameters = {
      id: response.data.map((image) => image.id),
      search_id: response.search_id,
    };

    const url = buildShutterstockImageDetailURL(detailQueryParameters, configuration);

    logger.debug('Built Shutterstock image detail URL', {
      url,
      detailQueryParameters,
      images: response.data,
    });

    const apiToken = configuration?.image?.preview?.apiToken;
    if (!apiToken) {
      logger.error('Configuration lacks image preview API token');
      throw new Error('Service is not available');
    }

    const shutterstockResponse = await axios.request<ShutterstockImageDetailResponse>({
      url: url.toString(),
      method: 'GET',
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(timeout),
    });

    logAxiosResponse({
      logger,
      message: 'Shutterstock response',
      response: shutterstockResponse,
      logResponseData: true,
    });

    for (const image of shutterstockResponse.data.data) {
      mosaicThumbnailMap.set(image.id, image.assets.mosaic.url);
    }

    return mosaicThumbnailMap;
  }

  async transformShutterstockImageSearchResponse(
    response: ShutterstockImageSearchResponse,
    configuration: ShutterstockAPIConfiguration,
    timeout: number,
  ): Promise<AssetSearchResponse<Image>> {
    const result = {
      search_id: response.search_id,
      page: response.page,
      per_page: response.per_page,
      page_count: response.data.length,
      total_count: response.total_count,
      assets: [] as Image[],
    };
    const mosaicThumbnailMap = await this.getMosaicThumbnails(response, configuration, timeout);
    for (const image of response.data) {
      result.assets.push({
        aspect: image.aspect,
        categories: image.categories.map((sourceCategory) => {
          return {
            source: this.getSourceName(),
            sourceCategoryID: sourceCategory.id,
            sourceCategoryName: sourceCategory.name,
          };
        }),
        description: image.description,
        fileSize: image.assets.huge_jpg?.file_size ?? 0,
        height: image.assets.huge_jpg?.height ?? 0,
        keywords: image.keywords,
        previewURL: image.assets.preview?.url,
        searchID: response.search_id,
        source: this.getSourceName(),
        sourceAssetID: image.id,
        thumbURL: mosaicThumbnailMap.get(image.id) ?? null,
        width: image.assets.huge_jpg?.width ?? 0,
      });
    }
    return result;
  }
}
