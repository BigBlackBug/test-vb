import { AxiosInstance } from 'axios';

import { ServiceDiscoverySDK } from '@libs/service-discovery-sdk';
import { AxiosSignedConnectionSource } from '@libs/service-access-lib';

import type { Service, WaymarkServiceAccessKey } from '@libs/shared-types';
import type { ImageSearchQueryParameters, VideoSearchQueryParameters } from '@libs/shutterstock-ts';
import {
  AssetLicenseResponse,
  AssetSearchResponse,
  AssetLicensePurpose,
  Image,
  ImageAssetDownloadRequest,
  ImageAssetDownloadResponse,
  ImageAssetLicense,
  LicenseImageRequest,
  ImageSize,
  LicenseVideoRequest,
  VideoSize,
  VideoAssetLicense,
  Video,
  VideoAssetDownloadRequest,
  AssetDownloadThumbResponse,
} from '@libs/media-asset-management-ts';

import store from 'app/state/store';
import * as selectors from 'app/state/selectors/index.js';

/**
 * Service for managing Shutterstock assets.
 */
class ShutterstockService {
  private serviceAccessKey: WaymarkServiceAccessKey | null = null;
  private serviceConfiguration: Service | null = null;
  private connection: AxiosInstance | null = null;

  /**
   * Creates a signed connection source which we can use to hit the service API.
   *
   * @param {WaymarkServiceAccessKey} serviceAccessKey
   */
  private async getConnection() {
    const serviceAccessKey = selectors.getServiceAccessToken(store.getState());
    if (this.connection && serviceAccessKey === this.serviceAccessKey) {
      return this.connection;
    }

    this.serviceAccessKey = serviceAccessKey;
    const connectionSource = new AxiosSignedConnectionSource(serviceAccessKey.identity);
    this.connection = await connectionSource.getSignedConnection();

    return this.connection;
  }

  /**
   * Gets the configuration for the Shutterstock service which most importantly
   * gives us the URL for the service's API.
   */
  private async getServiceConfiguration() {
    const serviceAccessKey = selectors.getServiceAccessToken(store.getState());

    if (!serviceAccessKey) {
      throw new Error('Could not find service access token for ShutterstockService');
    }

    if (this.serviceAccessKey !== serviceAccessKey) {
      this.serviceAccessKey = serviceAccessKey;
      const serviceDiscovery = new ServiceDiscoverySDK(serviceAccessKey);
      this.serviceConfiguration = await serviceDiscovery.discoverService('Shutterstock');
    }

    if (!this.serviceConfiguration) {
      throw new Error('Unable to find service configuration for Search');
    }

    return this.serviceConfiguration;
  }

  /// SHUTTERSTOCK IMAGES

  /**
   * Fetches search result images from Shutterstock for a given set of search parameters.
   */
  async searchImages(
    searchParameters: ImageSearchQueryParameters,
  ): Promise<AssetSearchResponse<Image>> {
    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL('/image/search', serviceConfiguration.baseURL);
    // Apply all search params to the URL
    for (const [parameter, value] of Object.entries(searchParameters)) {
      url.searchParams.set(parameter, `${value}`);
    }
    url.searchParams.sort();

    const connection = await this.getConnection();

    const response = await connection.get<AssetSearchResponse<Image>>(url.toString());
    return response.data;
  }

  /**
   * Takes an array of stock images and licenses them for the given purpose (usually either "preview" for drafts or "render" for purchased videos)
   */
  async licenseImages(
    images: Array<{
      sourceAssetID: string;
      searchID: string;
    }>,
    purpose: AssetLicensePurpose,
  ) {
    const accountGUID = selectors.getAccountGUID(store.getState());

    const payload: LicenseImageRequest = {
      images: images.map((image) => ({
        source_asset_id: image.sourceAssetID,
        source_search_id: image.searchID,
        purpose,
        account_id: accountGUID,
        // The payload needs a size but we pretty much never want anything but the full size image,
        // so just go with that
        size: ImageSize.Huge,
      })),
    };

    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL('/image/license', serviceConfiguration.baseURL);

    const connection = await this.getConnection();

    const response = await connection.post<AssetLicenseResponse<ImageAssetLicense>>(
      url.toString(),
      payload,
    );

    return response.data;
  }

  /**
   * Downloads an image from Shutterstock to an S3 bucket under our own control so we can
   * save it to a user's library and use it in our product.
   */
  async downloadImage(image: Image, license: ImageAssetLicense) {
    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL(`/image/download`, serviceConfiguration.baseURL);

    const payload: ImageAssetDownloadRequest = {
      asset: image,
      license,
    };

    const connection = await this.getConnection();

    const response = await connection.post<ImageAssetDownloadResponse>(url.toString(), payload);

    return response.data;
  }

  /// END SHUTTERSTOCK IMAGES

  /// SHUTTERSTOCK VIDEO

  /**
   * Fetches search result videos from Shutterstock for a given set of search parameters.
   */
  async searchVideos(searchParameters: VideoSearchQueryParameters) {
    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL('/video/search', serviceConfiguration.baseURL);
    // Apply all search params to the URL
    for (const [parameter, value] of Object.entries(searchParameters)) {
      url.searchParams.set(parameter, `${value}`);
    }
    url.searchParams.sort();

    const connection = await this.getConnection();

    const response = await connection.get<AssetSearchResponse<Video>>(url.toString());
    return response.data;
  }

  /**
   * Takes an array of stock videos and licenses them for the given purpose
   */
  async licenseVideos(
    videos: Array<{
      sourceAssetID: string;
      searchID: string;
    }>,
    purpose: AssetLicensePurpose,
  ) {
    const accountGUID = selectors.getAccountGUID(store.getState());

    const payload: LicenseVideoRequest = {
      videos: videos.map((video) => ({
        account_id: accountGUID,
        source_asset_id: video.sourceAssetID,
        source_search_id: video.searchID,
        purpose,
        size: VideoSize.HighDefinition,
      })),
    };

    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL('/video/license', serviceConfiguration.baseURL);

    const connection = await this.getConnection();

    const licenseResponses: AssetLicenseResponse<VideoAssetLicense>[] = [];

    // TODO: responsibilities for licensing raw previews along with previews are
    // going to to be moved up into the service layer, at which point this if statement can be removed
    if (purpose === AssetLicensePurpose.Preview) {
      const rawPreviewPayload: LicenseVideoRequest = {
        videos: payload.videos.map((payload) => ({
          ...payload,
          purpose: AssetLicensePurpose.RawPreview,
          size: VideoSize.StandardDefinition,
        })),
      };

      // License for raw preview first; we don't need to do anything with the response but
      // we need to run this sequentially before licensing for Preview
      const response = await connection.post<AssetLicenseResponse<VideoAssetLicense>>(
        url.toString(),
        rawPreviewPayload,
      );

      licenseResponses.push(response.data);
    }

    const response = await connection.post<AssetLicenseResponse<VideoAssetLicense>>(
      url.toString(),
      payload,
    );

    // Make sure the requested license is first in the array; the bonus raw preview response will come after
    licenseResponses.unshift(response.data);

    return licenseResponses;
  }

  /**
   * Downloads a video from Shutterstock to an S3 bucket under our own control so we can
   * save it to a user's library and use it in our product.
   */
  async downloadVideo(video: Video, license: VideoAssetLicense) {
    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL(`/video/download`, serviceConfiguration.baseURL);

    const payload: VideoAssetDownloadRequest = {
      asset: video,
      license,
    };

    const connection = await this.getConnection();

    const response = await connection.post<VideoAssetDownloadRequest>(url.toString(), payload);

    return response.data;
  }

  /**
   * Downloads thumbnails for a Shutterstock video to an S3 bucket
   */
  async downloadVideoThumbnail(video: Video) {
    const serviceConfiguration = await this.getServiceConfiguration();

    const url = new URL(`/video/downloadThumb`, serviceConfiguration.baseURL);

    const connection = await this.getConnection();
    const response = await connection.post<AssetDownloadThumbResponse<Video>>(
      url.toString(),
      video,
    );

    return response.data;
  }
}

export default new ShutterstockService();
