// Models
import BaseAssetLibrary from '../core/BaseAssetLibrary';
import Font from './Font';
import { FormattedFontLibraryData } from './utils';

/**
 * Base class with shared logic for managing all font libraries.
 * NOTE: this class should not be used directly. Instead, you should use one of its
 * subclasses: AccountFontLibrary, BusinessFontLibrary, or StaticFontLibrary.
 */
export default class BaseFontLibrary extends BaseAssetLibrary<Font> {
  // Assets should be sorted by ascending order and then by descending updatedAt date so the most recently added font comes first
  assetSortKeys = ['order', '-updatedAt'];

  guid: string | null;
  displayName: string | null;

  // Use this library's guid as a key to identify this libary in the UI
  get key() {
    return this.guid || this.libraryInstanceUUID;
  }

  /**
   * @param {Object} fontLibraryData
   * @param {string} fontLibraryData.guid - Unique guid identifying this library
   * @param {string} fontLibraryData.displayName - Display name for this library
   * @param {Object[]} fontLibraryData.fonts - List of Font instances that belong to this library
   */
  constructor({ displayName, guid, fonts = [] }: FormattedFontLibraryData) {
    super();

    this.displayName = displayName;
    this.guid = guid;

    this.setAssets(fonts);
  }
}
