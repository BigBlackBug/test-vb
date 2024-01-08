// Vendor
import { gql } from '@apollo/client';

// Shared
import { apolloClient } from 'shared/api/graphql';
import videoProcessingService from 'shared/web_video/utils/videoProcessingService';

// Editor
import { VideoFileUploadLimitExceededError } from 'editor/constants/customErrors.js';
import { maxSimultaneousUploadCount } from 'editor/constants/EditorVideo.js';
import {
  AddStockVideoToLibraryMutationVariables,
  addStockVideoToLibrary,
} from 'shared/api/graphql/stockVideoLibraries/mutations';
import { stockVideoLibraryFragment } from 'shared/api/graphql/stockVideoLibraries/fragments';
import ShutterstockService from 'shared/services/ShutterstockService';
import { AssetLicensePurpose, Video } from '@libs/media-asset-management-ts/src';

// Define a query that can be used to refresh the business library and totalVideoCount
const REFRESH_BUSINESS_STOCK_VIDEO_LIBRARY_QUERY = gql`
  ${stockVideoLibraryFragment.fragment}

  query RefreshBusinessStockVideoLibrary($businessGUID: String!) {
    businessByGuid(guid: $businessGUID) {
      id
      guid
      totalVideoCount

      stockVideoLibraries {
        edges {
          node {
            ...${stockVideoLibraryFragment.name}
          }
        }
      }
    }
  }
`;

const REFRESH_ACCOUNT_STOCK_VIDEO_LIBRARY_QUERY = gql`
  ${stockVideoLibraryFragment.fragment}

  query RefreshAccountStockVideoLibrary($accountGUID: String!) {
    accountByGuid(guid: $accountGUID) {
      id
      guid

      stockVideoLibraries {
        edges {
          node {
            ...${stockVideoLibraryFragment.name}
          }
        }
      }
    }
  }
`;

const UPLOADING_ASSET_IDS_CHANGED_EVENT = 'UPLOADING_ASSET_IDS_CHANGED_EVENT';

/**
 * Class is responsible for creating a stock video asset for an account or business,
 * copying the asset to S3, marking assets as transcoded, and managing a list of
 * in-progress uploads.
 *
 * @class StockVideoAssetUploader
 */
class StockVideoAssetUploader {
  private eventTarget: EventTarget;
  uploadingStockAssetIds: string[];

  constructor() {
    this.eventTarget = new EventTarget();
    this.uploadingStockAssetIds = [];
  }

  subscribeUploadingIdsChanged(listener: (updatedAssetIDs: string[]) => void) {
    const listenerCallback = () => listener(this.uploadingStockAssetIds);
    this.eventTarget.addEventListener(UPLOADING_ASSET_IDS_CHANGED_EVENT, listenerCallback);
    return () =>
      this.eventTarget.removeEventListener(UPLOADING_ASSET_IDS_CHANGED_EVENT, listenerCallback);
  }

  /**
   * Attempts to add a stock video from the stock video search API
   * to this library, and runs the asset through the VPS if needed
   *
   * @returns {Promise<string>}   Returns a promise which resolves to the VPS key for the stock asset that was
   *                                successfully added to the library
   */
  async createStockVideoAsset({
    stockVideoData,
    accountGUID,
    businessGUID,
  }: {
    stockVideoData: Video;
    accountGUID: string;
    businessGUID: string;
  }): Promise<string> {
    // If uploading this new file would cause us to exceed our max cap of 10 files uploading/processing at a time, throw an error
    if (this.uploadingStockAssetIds.length >= maxSimultaneousUploadCount) {
      throw new VideoFileUploadLimitExceededError();
    }

    const uploadingAssetSourceID = stockVideoData.sourceAssetID;
    this.uploadingStockAssetIds = [uploadingAssetSourceID, ...this.uploadingStockAssetIds];
    this.eventTarget.dispatchEvent(new Event(UPLOADING_ASSET_IDS_CHANGED_EVENT));

    let uploadError: Error | null = null;
    let vpsKey: string | null = null;

    try {
      const licenseResponses = await ShutterstockService.licenseVideos(
        [
          {
            sourceAssetID: stockVideoData.sourceAssetID,
            searchID: stockVideoData.searchID,
          },
        ],
        AssetLicensePurpose.Preview,
      );

      vpsKey = licenseResponses[0].assetLicenses[0].assetID;

      const downloadVideosPromise = Promise.all(
        licenseResponses.flatMap((licenseResponse) =>
          licenseResponse.assetLicenses.map(async (license) =>
            ShutterstockService.downloadVideo(
              {
                ...stockVideoData,
                vpsKey: vpsKey ?? undefined,
              },
              license,
            ),
          ),
        ),
      );

      // Make sure we download the thumbnail it will be available in the UI
      // when the video is added to the library
      const downloadThumbnailPromise = ShutterstockService.downloadVideoThumbnail({
        ...stockVideoData,
        vpsKey,
      });

      await Promise.all([downloadVideosPromise, downloadThumbnailPromise]);

      // Start processing the video in the VPS
      videoProcessingService.bulkProcessSourceVideo(vpsKey, 'webPlayerFastv1');

      // Construct the input that we'll post to the addStockVideoToLibrary mutation
      const inputVariables: AddStockVideoToLibraryMutationVariables['input'] = {
        vpsKey,
        stockSource: stockVideoData.source,
        sourceAssetId: stockVideoData.sourceAssetID,
        sourceSearchId: stockVideoData.searchID,
        width: stockVideoData.width,
        height: stockVideoData.height,
        length: stockVideoData.length,
        description: stockVideoData.description,
        categories: stockVideoData.categories.map((category) => ({
          id: category.sourceCategoryID,
          name: category.sourceCategoryName,
        })),
        keywords: stockVideoData.keywords,
      };

      if (accountGUID) {
        inputVariables.accountGuid = accountGUID;
      } else {
        inputVariables.businessGuid = businessGUID;
      }

      await addStockVideoToLibrary(inputVariables);

      // Run a query to refresh the library (and business totalVideoCount if applicable)
      if (accountGUID) {
        await apolloClient.query({
          query: REFRESH_ACCOUNT_STOCK_VIDEO_LIBRARY_QUERY,
          variables: {
            accountGUID,
          },
          fetchPolicy: 'network-only',
        });
      } else {
        await apolloClient.query({
          query: REFRESH_BUSINESS_STOCK_VIDEO_LIBRARY_QUERY,
          variables: {
            businessGUID,
          },
          fetchPolicy: 'network-only',
        });
      }
    } catch (error) {
      // Mark that the upload failed so we can throw an error once our `finally` cleanup is done
      uploadError = error as Error;
    } finally {
      // Remove the upload placeholder now that the upload is done, regardless of whether it succeeded or failed
      this.uploadingStockAssetIds = this.uploadingStockAssetIds.filter(
        (id) => id !== uploadingAssetSourceID,
      );
      this.eventTarget.dispatchEvent(new Event(UPLOADING_ASSET_IDS_CHANGED_EVENT));
    }

    if (uploadError) {
      // If the upload failed, re-throw the error
      throw uploadError;
    }

    if (!vpsKey) {
      throw new Error('createStockVideoAsset failed to produce valid VPS key');
    }

    return vpsKey;
  }
}

export default new StockVideoAssetUploader();
