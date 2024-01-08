// Models
import { getURLPathAndDomain } from 'shared/utils/urls.js';
import BaseAssetLibrary from '../core/BaseAssetLibrary';
import ImageAsset from './ImageAsset';
import { FormattedImageLibraryData } from './types';

/**
 * Base class with shared logic for managing all image libraries.
 */
export default class BaseImageLibrary extends BaseAssetLibrary<ImageAsset> {
  // Assets can be searched on `displayName`
  assetSearchKeys = ['displayName'];

  // Assets are sorted by logos first, then ascending order, then as a final tiebreaker,
  // by descending updatedAt date so the most recently updated images come first
  assetSortKeys = ['-isLogo', 'order', '-updatedAt'];

  // Removed assets are sorted descending removedAt date
  removedAssetSortKeys = ['-removedAt'];

  slug: string | null;
  displayName: string;

  // Use this library's slug as a key to identify this libary in the UI
  get key() {
    return this.slug || this.libraryInstanceUUID;
  }

  /**
   * @param {Object} imageLibraryData
   * @param {string} imageLibraryData.slug - Unique slug identifying this library
   * @param {string} imageLibraryData.displayName - Display name for this library
   * @param {Object[]} imageLibraryData.images - List of ImageAssets that are in this library
   * @param {Object[]} imageLibraryData.removedImages - List of ImageAssets that have been removed from
   *                                                    this library and can be restored in a restoration panel
   */
  constructor({ slug, displayName, images, removedImages }: FormattedImageLibraryData) {
    super();

    this.slug = slug;
    this.displayName = displayName;

    this.setAssets(images);
    this.setRemovedAssets(removedImages);
  }

  /**
   * Given an image URL, return the corresponding image asset if it exists in the library.
   *
   * @param {string} imageURL - Image URL to search
   * @returns {ImageAsset | undefined}
   */
  getImageAssetForURL(imageURL: string) {
    if (!imageURL) {
      return undefined;
    }

    // Only comparing the path and domain lets this function work on local and test/prod environments
    const matchURL = getURLPathAndDomain(imageURL);

    return this.assets.find((asset) => {
      // Check both the image's original URL and the upscaled version
      const baseAssetURL = getURLPathAndDomain(asset.baseImageURL);
      const enhancedURL = asset.upscaledImageURL ? getURLPathAndDomain(asset.upscaledImageURL) : '';

      if (matchURL === baseAssetURL || matchURL === enhancedURL) {
        return asset;
      }

      return undefined;
    });
  }
}
