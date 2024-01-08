// Local
import BaseAssetLibrary from '../core/BaseAssetLibrary';
import Color from './Color';
import { FormattedColorLibraryData } from './types';

// Class for transforming returned color library query data into an object
// that contains helper functions for managing colors.
export default class BaseColorLibrary extends BaseAssetLibrary<Color> {
  // Assets are sorted by ascending order and then by ascending updatedAt date; we usually sort by descending updatedAt,
  // but it makes more sense in the color library UI to sort the other way
  assetSortKeys = ['order', 'updatedAt'];

  guid: string | null;
  displayName: string | null;

  // Use this library's guid as a key to identify this libary in the UI
  get key() {
    return this.guid || this.libraryInstanceUUID;
  }

  /**
   * @param {Object}  colorLibraryData
   * @param {string}  colorLibraryData.guid - Unique guid identifying this library
   * @param {string}  colorLibraryData.displayName - Display name for this library
   * @param {Object[]}  colorLibraryData.colors - List of Color instances that belong to this library
   */
  constructor({ guid, displayName, colors = [] }: FormattedColorLibraryData) {
    super();

    this.guid = guid;
    this.displayName = displayName;

    this.setAssets(colors);
  }
}
