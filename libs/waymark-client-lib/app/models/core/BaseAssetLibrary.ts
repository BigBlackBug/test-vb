// Vendor
import _ from 'lodash';
import Fuse from 'fuse.js';

// Shared
import { uuid } from 'shared/utils/uuid.js';

/**
 * Base class with shared logic for managing all asset libraries (ie, fonts, images, etc)
 */
export default class BaseAssetLibrary<GenericAssetType> {
  // Defines a list of keys on this library's assets which we want to be able to
  // search on (ie, "displayName")
  // Set this in library subclasses where users need to be able to search the library's assets.
  assetSearchKeys: Array<string> = [];

  // Defines the keys that this library's assets should be sorted by.
  // The ordering of this array defines the priority of the sorting; assets will be sorted
  // by the first key whenever possible, continuing down the list of keys as necessary for tiebreakers.
  // Sorting on each key will be ascending by default, but you can define
  // whether the sorting should be descending by prefixing the key with "-".
  // For instance, ["order", "-updatedAt"] will sort the assets by ascending order,
  // and then sort by descending updatedAt date for any assets with the same order value.
  // Set this in library subclasses to ensure assets are sorted consistently.
  assetSortKeys: Array<string> = [];

  // Defines the keys that this library's removed assets should be sorted by, in the same
  // format as described for assetSortKeys above.
  // For instance, ["-removedAt"] will sort the assets by descending removedAt date so
  // that more recently deleted assets come first.
  // Set this in library subclasses to ensure removed assets are sorted consistently, if applicable.
  removedAssetSortKeys: Array<string> = [];

  // Lists of assets/removed assets in this library
  assets: Array<GenericAssetType> = [];

  removedAssets: Array<GenericAssetType> = [];

  // Fuse instance used for searching assets on keys specified in this.assetSearchKeys
  fuseSearch: Fuse<GenericAssetType> | null = null;

  // Whether this library has any assets which can be searched
  isSearchable = false;

  // Unique UUID for this library instance; can be used as a fallback
  // key if the library does not have a unique identifier like a guid or slug
  libraryInstanceUUID: string;

  constructor() {
    this.libraryInstanceUUID = uuid();
  }

  /**
   * Sorts an array of assets by a specified list of keys
   *
   * @param {Object[]} assets - An unordered list of library asset objects
   * @param {string[]} sortKeys - List of key strings on the asset objects to sort by (ie, this.assetSortKeys or this.removedAssetSortKeys)
   *
   * @returns {Object[]}  The original assets array, sorted by the specified sort keys
   */
  static sortLibraryAssets = <T>(assets: Array<T>, sortKeys: Array<string>): Array<T> => {
    if (_.isEmpty(sortKeys)) return assets;

    const sortedAssets = assets.sort((assetA, assetB) => {
      // Iterate through our sort keys to determine how the assets should be sorted relative to each other
      for (let i = 0; i < sortKeys.length; i += 1) {
        const rawSortKey = sortKeys[i];

        // A sort key is ascending by default, but can be defined as descending if prefixed with a '-'
        const isDescending = rawSortKey.startsWith('-');
        // Remove the '-' prefix if it exists
        const sortKey = isDescending ? rawSortKey.slice(1) : rawSortKey;

        const aValue = _.get(assetA, sortKey);
        const bValue = _.get(assetB, sortKey);

        // If the raw sort key values are shallowly equal, continue to the next sort key
        if (aValue !== bValue) {
          // See if we can compare the values as numbers (casting with Number will also convert Date objects to a ms timestamp
          // and boolean values to true = 1, false = 0)
          const aValueAsNumber = Number(aValue);
          const bValueAsNumber = Number(bValue);

          if (!Number.isNaN(aValueAsNumber) && !Number.isNaN(bValueAsNumber)) {
            // Only use these values for sorting if they aren't equal; otherwise we should continue
            // to check the next sort key, if available
            if (aValueAsNumber !== bValueAsNumber) {
              // Subtract the values to determine how they should be sorted relative to each other
              return isDescending ? bValue - aValue : aValue - bValue;
            }
          }
          // If the values are strings, compare them alphabetically
          else if (typeof aValue === 'string' && typeof bValue === 'string') {
            // Convert to lowercase to ensure case-insensitive sorting
            const aValueAsComparableString = aValue.toLowerCase();
            const bValueAsComparableString = bValue.toLowerCase();

            if (aValueAsComparableString !== bValueAsComparableString) {
              // string.localeCompare() returns a number indicating whether the second string comes before
              // or after the first string alphabetically
              return isDescending
                ? bValueAsComparableString.localeCompare(aValueAsComparableString)
                : aValueAsComparableString.localeCompare(bValueAsComparableString);
            }
          }
        }
      }

      // If we couldn't find any success trying to sort these two assets on any of the sort keys,
      // just return 0 to keep them in the same order
      return 0;
    });

    return sortedAssets;
  };

  /**
   * If this library is searchable, takes a search query string and returns a list of
   * assets that match the query, ordered by strength of match.
   *
   * @param {string} searchString
   */
  search(searchString: string): Array<GenericAssetType> {
    if (this.isSearchable && this.fuseSearch) {
      return this.fuseSearch.search(searchString).map((result) => result.item);
    }

    return [];
  }

  /**
   * Updates the list of assets stored for this library
   *
   * @param {Object[]} newAssets
   */
  setAssets(newAssets: Array<GenericAssetType>) {
    const sortedNewAssets = BaseAssetLibrary.sortLibraryAssets(newAssets, this.assetSortKeys);

    this.assets = sortedNewAssets;

    // This library's assets are searchable if this library has keys to search on
    // and at least one asset
    const searchableAssets = sortedNewAssets.filter((asset) => {
      for (let i = 0; i < this.assetSearchKeys.length; i += 1) {
        if (_.get(asset, this.assetSearchKeys[i])) {
          // Return true to include this asset in the list of searchable assets
          // if any of its values for any of the search keys is truthy
          return true;
        }
      }

      return false;
    });

    this.isSearchable = !_.isEmpty(searchableAssets);

    if (this.isSearchable) {
      // Create a Fuse search instance which can be used to search the assets by the assetSearchKeys
      this.fuseSearch = new Fuse(searchableAssets, {
        keys: this.assetSearchKeys,
        threshold: 0.4,
        ignoreLocation: true,
      });
    }
  }

  /**
   * Updates the list of removed assets stored for this library
   *
   * @param {Object[]} newRemovedAssets
   */
  setRemovedAssets(newRemovedAssets: Array<GenericAssetType>) {
    const sortedNewRemovedAssets = BaseAssetLibrary.sortLibraryAssets(
      newRemovedAssets,
      this.removedAssetSortKeys,
    );
    this.removedAssets = sortedNewRemovedAssets;
  }
}
