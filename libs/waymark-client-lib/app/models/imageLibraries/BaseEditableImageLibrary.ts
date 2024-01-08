// Vendor
import EventEmitter from 'eventemitter3';

// Shared
import imageUploadService from 'shared/services/ImageUploadService';
import { EditorFileUploadError } from 'editor/utils/editorFileUpload';
import imageEnhancementService from 'shared/services/ImageEnhancementService.js';
import { apolloClient } from 'shared/api/graphql';
import { getURLPathAndDomain } from 'shared/utils/urls.js';
import type { Image as StockImage } from 'libs/media-asset-management-ts';
// We have to directly import this enum from its file instead of the lib's index because
// the media-asset-management-ts lib also exports some code which causes jest to blow up for some reason.
import { AssetLicensePurpose } from '@libs/media-asset-management-ts/src/asset';
import ShutterstockService from 'shared/services/ShutterstockService';

// Mutations
import {
  ImageLibraryImage,
  imageLibraryFragments,
} from 'shared/api/graphql/imageLibraries/fragments';
import {
  addImageToImageLibrary,
  removeImageLibraryImage,
  restoreRemovedImageLibraryImage,
} from 'shared/api/graphql/imageLibraries/mutations';

import UploadingAsset from '../core/UploadingAsset';
import BaseImageLibrary from './BaseImageLibrary';
import { FormattedImageLibraryData } from './types';
import ImageAsset from './ImageAsset';

// Tracking certain library asset lists globally so they can persist if the model instance is remade
const uploadingLibraryAssets = new Map<string, UploadingAsset[]>();
const upscalingLibraryAssets = new Map<string, ImageAsset[]>();
const downscaledLibraryAssets = new Map<string, ImageAsset[]>();

const uploadingAssetEventEmitter = new EventEmitter();

/**
 * An library which the user can edit add/remove images in
 * ie, a business or account image library
 */
export default class BaseEditableImageLibrary extends BaseImageLibrary {
  isEditable = true;

  uploadingAssetsChangedEventName = '';
  upscalingAssetsChangedEventName = '';

  isBusinessLibrary = false;

  /**
   * If this BaseEditableImageLibrary instance doesn't have a slug, it does not currently
   * map to an existing record in the database. In that case,
   * any mutations will need to create a new image library record first and store that library's
   * data on this instance
   */
  get isPlaceholder() {
    return !this.slug;
  }

  /**
   * Returns the list of assets in the process of being uploaded to this library, if any
   */
  get uploadingAssets() {
    return uploadingLibraryAssets.get(this.key) ?? [];
  }

  /**
   * Returns the list of assets with an in-progress upscale request, if any
   */
  get upscalingAssets() {
    return upscalingLibraryAssets.get(this.key) ?? [];
  }

  /**
   * Returns the list of assets that have been reverted to their original version, if any
   */
  get downscaledAssets() {
    return downscaledLibraryAssets.get(this.key) ?? [];
  }

  constructor(imageLibraryData: FormattedImageLibraryData) {
    super(imageLibraryData);

    const instanceKey = this.key;

    this.uploadingAssetsChangedEventName = `imageLibraryUploadingAssetsChanged:${instanceKey}`;
    this.upscalingAssetsChangedEventName = `imageLibraryUpscalingAssetsChanged:${instanceKey}`;

    if (!uploadingLibraryAssets.has(instanceKey)) {
      uploadingLibraryAssets.set(instanceKey, []);
    }

    if (!upscalingLibraryAssets.has(instanceKey)) {
      upscalingLibraryAssets.set(instanceKey, []);
    }
  }

  /**
   * If this BaseEditableImageLibrary instance is a placeholder, this method will get/create
   * a font library and update this instance to track that new library.
   *
   * NOTE: This method must be implemented on all classes which extend the `BaseEditableImageLibrary` class.
   */
  async createImageLibrary(): Promise<FormattedImageLibraryData | null> {
    throw new Error(
      `Not implemented: 'createImageLibrary' must be implemented on ${this.constructor.name}`,
    );
  }

  /**
   * Updates the list of assets in the process of being uploaded to this library and emits an event to notify subscribers
   *
   * @param {UploadingAsset[]} newUploadingAssets
   */
  updateUploadingAssets(newUploadingAssets: UploadingAsset[]) {
    uploadingLibraryAssets.set(this.key, newUploadingAssets);
    // Emit an event to notify listeners that the library's uploading assets have changed
    uploadingAssetEventEmitter.emit(this.uploadingAssetsChangedEventName, newUploadingAssets);
  }

  /**
   * Sets up an event listener which will fire whenever the library's uploading assets change
   *
   * @param {function} onChange   Listener function to call with the updated list of uploading assets when they change
   * @param {bool}  shouldRunOnceImmediately    Whether we should run the listener once right away (useful to make sure we set up the initial state)
   *
   * @returns {function} A cleanup function to call to remove the listener
   */
  subscribeToUploadingAssetChanges(
    onChange: (updatedImageAssets: UploadingAsset[]) => void,
    shouldRunOnceImmediately = false,
  ) {
    if (shouldRunOnceImmediately) {
      onChange(this.uploadingAssets);
    }

    uploadingAssetEventEmitter.on(this.uploadingAssetsChangedEventName, onChange);

    const unsubscribe = () => {
      uploadingAssetEventEmitter.off(this.uploadingAssetsChangedEventName, onChange);
    };

    return unsubscribe;
  }

  /**
   * Takes an image File object, uploads it to s3, and fires a mutation to add it to this library
   *
   * @param {File} imageFile
   */
  async uploadImageFile(imageFile: File) {
    if (this.isPlaceholder) {
      // If this library instance is a placeholder, create an image library which we can upload to first
      // NOTE: this needs to be implemented in child classes of BaseEditableImageLibrary
      await this.createImageLibrary();
    }

    const placeholderUploadAsset = new UploadingAsset();
    this.updateUploadingAssets([placeholderUploadAsset, ...this.uploadingAssets]);

    let createdImageLibraryImage: ImageLibraryImage | null = null;

    try {
      const { imageFileName, width, height } = await imageUploadService.uploadImageLibraryImage(
        imageFile,
        (progressEvent) => {
          // Update the placeholder asset's upload progress as the file uploads
          placeholderUploadAsset.uploadProgress = progressEvent.loaded / progressEvent.total;
          // Remake the uploading assets array to trigger a change event
          this.updateUploadingAssets([...this.uploadingAssets]);
        },
      );

      if (!this.slug) {
        throw new Error('Image library slug is required.');
      }

      const result = await addImageToImageLibrary(this.slug, {
        imageFileName,
        width,
        height,
        imageType: this.isBusinessLibrary ? 'business_image' : 'library_image',
        imageSource: 'user_upload',
      });

      if (result) {
        ({ createdImageLibraryImage } = result);
      }
    } catch (error) {
      console.error(
        `Something went wrong while attempting to add image file "${imageFile.name}" to image library ${this.constructor.name}(${this.slug})`,
        error,
      );

      let errorMessage = 'An unknown error occurred.';

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      throw new EditorFileUploadError(errorMessage);
    } finally {
      // Remove the placeholder uploading asset now that we're done with it regardless of whether the upload succeeed or failed
      this.updateUploadingAssets(
        this.uploadingAssets.filter((asset) => asset !== placeholderUploadAsset),
      );
    }

    return createdImageLibraryImage;
  }

  /**
   * Saves a stock image to the library
   *
   * @param {StockImage} stockImage - The stock image object to save
   */
  async addStockImageToLibrary(stockImage: StockImage) {
    if (this.isPlaceholder) {
      // If this library instance is a placeholder, create an image library which we can upload to first
      // NOTE: this needs to be implemented in child classes of BaseEditableImageLibrary
      await this.createImageLibrary();
    }

    const placeholderUploadAsset = new UploadingAsset({
      shouldAutoIncrementProgress: true,
    });
    this.updateUploadingAssets([placeholderUploadAsset, ...this.uploadingAssets]);

    let createdImageLibraryImage: ImageLibraryImage | null = null;

    try {
      const licenseResponse = await ShutterstockService.licenseImages(
        [
          {
            sourceAssetID: stockImage.sourceAssetID,
            searchID: stockImage.searchID,
          },
        ],
        AssetLicensePurpose.Preview,
      );

      const downloadedImage = await ShutterstockService.downloadImage(
        stockImage,
        licenseResponse.assetLicenses[0],
      );

      // Jump to 100% progress and disable the auto-incrementing
      placeholderUploadAsset.uploadProgress = 1;
      placeholderUploadAsset.shouldAutoIncrementProgress = false;
      this.updateUploadingAssets([...this.uploadingAssets]);

      const { width, height, sourceAssetID: stockAssetID } = downloadedImage.asset;
      const { key: imageFileName } = downloadedImage.assetToS3Response;

      if (!this.slug) {
        throw new Error('Image library slug is required.');
      }

      const result = await addImageToImageLibrary(this.slug, {
        imageFileName,
        width,
        height,
        stockAssetID,
        stockSearchID: stockImage.searchID,
        imageType: 'stock_image',
        imageSource: 'shutterstock',
      });

      if (result) {
        ({ createdImageLibraryImage } = result);
      }
    } catch (error) {
      console.error(
        `Something went wrong while attempting to add stock image "${stockImage.sourceAssetID}" to image library ${this.constructor.name}(${this.slug})`,
        error,
      );
    } finally {
      // Remove the placeholder uploading asset now that we're done with it regardless of whether the upload succeeed or failed
      this.updateUploadingAssets(
        this.uploadingAssets.filter((asset) => asset !== placeholderUploadAsset),
      );
    }

    return createdImageLibraryImage;
  }

  /**
   * Takes an ImageAsset instance and fires a mutation to remove it from this library
   *
   * @param {ImageAsset} imageToRemove
   */
  async removeImage(imageToRemove: ImageAsset) {
    // Fonts can't be removed from this library if it's a placeholder
    if (this.isPlaceholder) {
      return false;
    }

    try {
      await removeImageLibraryImage(imageToRemove.guid);

      return true;
    } catch (error) {
      console.error('Error removing image from library:', error);
    }

    return false;
  }

  /**
   * Takes a removed ImageAsset instance and fires a mutation to restore it to this library
   *
   * @param {ImageAsset} imageToRemove
   */
  async restoreRemovedImage(imageToRestore: ImageAsset) {
    // Images can't be restored to this library if it's a placeholder
    if (this.isPlaceholder) {
      return false;
    }

    try {
      await restoreRemovedImageLibraryImage(imageToRestore.guid);

      return true;
    } catch (error) {
      console.error('Error restoring removed image to library:', error);
    }

    return false;
  }

  /**
   * Sets up an event listener which will fire whenever the library's upscaling assets change
   *
   * @param {function} onChange   Listener function to call with the updated list of upscaling assets when they change
   * @param {bool}  shouldRunOnceImmediately    Whether we should run the listener once right away (useful to make sure we set up the initial state)
   *
   * @returns {function} A cleanup function to call to remove the listener
   */
  subscribeToUpscalingAssetChanges(
    onChange: (upscalingAssets: ImageAsset[]) => void,
    shouldRunOnceImmediately = false,
  ) {
    if (shouldRunOnceImmediately) {
      onChange(this.upscalingAssets);
    }

    uploadingAssetEventEmitter.on(this.upscalingAssetsChangedEventName, onChange);

    const unsubscribe = () => {
      uploadingAssetEventEmitter.off(this.upscalingAssetsChangedEventName, onChange);
    };

    return unsubscribe;
  }

  /**
   * Bulk update the `isUpscaled` flag on library assets.
   *
   * If the asset does not have an upscaled version, the current list of URLs (user video image URLs) contains
   * the original asset URL, or the user has reverted the image during this session, display the original version.
   * Otherwise, display the upscaled version of the asset if it's available.
   *
   * @param {Array<string>} imageURLs
   */
  setCurrentUpscaledImages(imageURLs: Array<string>) {
    // In order for this to work locally and on test/prod envs (http vs. https) we want to only compare
    // the host and path as opposed to the entire URL
    const baseURLs = imageURLs.map((url) => getURLPathAndDomain(url));

    this.assets = this.assets.map((asset) => {
      if (baseURLs.includes(getURLPathAndDomain(asset.baseImageURL))) {
        asset.isUpscaled = false;
      } else if (asset.upscaledImageURL) {
        const wasDownscaled = Boolean(
          this.downscaledAssets.find((revertedAsset) => revertedAsset.guid === asset.guid),
        );

        // Explicitly update each remaining asset to ensure that the currently displayed
        // version keeps up with user actions
        asset.isUpscaled = !wasDownscaled;
      }

      return asset;
    });
  }

  /**
   * Request an upscaled version of a library asset and manage the library's internal list of upscaling assets
   *
   * @param {ImageAsset} imageAsset - Request upscaled version of this asset
   * @param {function} onSuccess - Success callback for image upscaling request
   * @param {function} onError - Error callback for image upscaling request
   */
  async upscaleImage(
    imageAsset: ImageAsset,
    onSuccess: (url: string, asset: ImageAsset) => void,
    onError: () => void,
  ) {
    this.updateUpscalingImages([...this.upscalingAssets, imageAsset]);

    const { cache } = apolloClient;

    await imageEnhancementService.upscaleImage({
      imageLibraryImageGUID: imageAsset.guid,
      onSuccess: async (payload: any) => {
        const upscaledImageUrl = payload.data.enhanced_image_url;

        // The ImageEnhancement service is powered by a REST API so we need to manually update the Apollo cache so
        // other GraphQL queries that rely on this data are updated
        await cache.updateFragment(
          {
            id: imageAsset.cacheID as string,
            fragment: imageLibraryFragments.imageLibraryImage.fragment,
            broadcast: true,
          },
          (data) => ({ ...data, upscaledImageUrl }),
        );

        imageAsset.isUpscaled = true;
        imageAsset.upscaledImageURL = upscaledImageUrl;

        this.updateUpscalingImages(
          this.upscalingAssets.filter((asset) => asset.guid !== imageAsset.guid),
        );

        onSuccess(upscaledImageUrl, imageAsset);
      },
      onError: () => {
        this.updateUpscalingImages(
          this.upscalingAssets.filter((asset) => asset.guid !== imageAsset.guid),
        );

        onError();
      },
    });
  }

  /**
   * Updates the list of assets with in-progress upscaling requests and emits an event to notify subscribers
   *
   * @param {ImageAsset[]} upscalingImages
   */
  updateUpscalingImages(upscalingImages: ImageAsset[]) {
    upscalingLibraryAssets.set(this.key, upscalingImages);
    uploadingAssetEventEmitter.emit(this.upscalingAssetsChangedEventName, upscalingImages);
  }

  /**
   * Update a library asset's `isUpscaled` flag and internal lists
   *
   * @param {ImageAsset} imageAsset - Update `isUpscaled` flag on this ImageAsset
   * @param {boolean} isUpscaled - If the asset should be displayed as upscaled or downscaled
   */
  updateAssetScale(imageAsset: ImageAsset, isUpscaled: boolean) {
    this.assets = this.assets.map((asset) => {
      if (asset.guid === imageAsset.guid) {
        asset.isUpscaled = isUpscaled;
      }

      return asset;
    });

    let currentDownscaledAssets;
    if (isUpscaled) {
      currentDownscaledAssets = this.downscaledAssets.filter(
        (asset) => asset.guid !== imageAsset.guid,
      );
    } else {
      currentDownscaledAssets = [...this.downscaledAssets, imageAsset];
    }

    downscaledLibraryAssets.set(this.key, currentDownscaledAssets);
  }
}
