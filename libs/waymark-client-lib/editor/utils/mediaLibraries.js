// Vendor
import _ from 'lodash';

// Local
import {
    mediaLibrarySlugs,
    assetOwnerTypes,
    assetTypes,
    mediaTypes,
} from 'editor/constants/mediaLibraries.js';
import StaticVideoAsset from 'app/models/StaticVideoAsset.js';
import StockVideoAsset from 'app/models/StockVideoAsset.js';
import UploadedVideoAsset from 'app/models/UploadedVideoAsset.js';

const ACTIVE_ASSET_SORT_KEY = 'updatedAt';
const REMOVED_ASSET_SORT_KEY = 'removedAt';
const ASSET_SORT_DIRECTION = 'desc';
// Object defines what types of owner and type a library slug needs to filter by
const MEDIA_LIBRARY_TYPE_FILTERS = {
    [mediaLibrarySlugs.accountAll]: {
        owner: assetOwnerTypes.account,
    },
    [mediaLibrarySlugs.accountStock]: {
        owner: assetOwnerTypes.account,
        type: assetTypes.stock,
    },
    [mediaLibrarySlugs.accountUploads]: {
        owner: assetOwnerTypes.account,
        type: assetTypes.userUpload,
    },
    [mediaLibrarySlugs.businessAll]: {
        owner: assetOwnerTypes.business,
    },
    [mediaLibrarySlugs.businessSearchResults]: {
        owner: assetOwnerTypes.business,
        type: assetTypes.searchResult,
    },
    [mediaLibrarySlugs.businessStock]: {
        owner: assetOwnerTypes.business,
        type: assetTypes.stock,
    },
    [mediaLibrarySlugs.businessUploads]: {
        owner: assetOwnerTypes.business,
        type: assetTypes.userUpload,
    },
    [mediaLibrarySlugs.static]: {
        type: assetTypes.static,
    },
};

/**
 * Filters a group of image assets based on the defined filter values for a given library slug
 *
 * @param {string} librarySlug    Image library slug
 * @param {Array[Object]} assets    Asset collection to filter
 */
const filterAssetsByLibraryType = (librarySlug, assets) =>
    _.filter(assets, MEDIA_LIBRARY_TYPE_FILTERS[librarySlug]);

/**
 * Determines whether or not a collection of assets contains (at least) one
 * removed asset, i.e. an asset with a 'removedAt' value
 *
 * @param {string} librarySlug    Library slug
 * @param {Array[Object]} imageAssets    Collection of assets possibly containing
 *                                       removed assets
 * @returns {Boolean}
 */
export const getDoesLibraryHaveRemovedAssets = (librarySlug, imageAssets) => {
    const libraryAssets = filterAssetsByLibraryType(librarySlug, imageAssets);

    return libraryAssets.some((asset) => Boolean(asset.removedAt));
};

/**
 * Filters through each config and returns which secions have removed assets
 *
 * @param {Array[Object]} assets    All assets for media type
 * @param {Array[LibrarySectionConfig]} sectionConfigs
 * @returns {Array[LibrarySectionConfig]}
 */
export const getSectionsWithRemovedAssets = (assets, sectionConfigs) =>
    sectionConfigs.filter(({
        slug
    }) => getDoesLibraryHaveRemovedAssets(slug, assets));

/**
 * Filter and sort a collection of media library assets by their library type specs
 *
 * @param {string} librarySlug    Library slug
 * @param {Array[Object]} assets    Assets to filter and sort
 * @param {Boolean} isRemoved    Whether returned collection should include (only)
 *                               removed assets
 */
export const getOrderedLibraryAssets = (librarySlug, assets, isRemoved = false) => {
    const filteredAssets = filterAssetsByLibraryType(librarySlug, assets);

    if (isRemoved) {
        return _.orderBy(
            filteredAssets.filter((asset) => Boolean(asset.removedAt)),
            REMOVED_ASSET_SORT_KEY,
            ASSET_SORT_DIRECTION,
        );
    }

    return _.orderBy(
        filteredAssets.filter((asset) => !asset.removedAt),
        ACTIVE_ASSET_SORT_KEY,
        ASSET_SORT_DIRECTION,
    );
};

/**
 * Determine's a library's display name
 *
 * @param {string} defaultDisplayName    Library's default name
 * @param {string} owner    Library owner's name
 * @returns {string}    Library display name
 */
const getLibraryDisplayName = (defaultDisplayName, owner = null) => {
    // If the library's owner has a name (account or business name), use that instead of
    // a generic owner
    if (owner) {
        // Default names are structured like 'My Images' or 'Stock Footage' so we can
        // take the second word of each string
        const libraryAssetLabel = defaultDisplayName.split(' ')[1];
        return `${owner}'s ${libraryAssetLabel}`;
    }

    // Otherwise just return the library's default display name
    return defaultDisplayName;
};

/**
 * @typedef {Object} LibrarySectionConfig
 *
 * @property {string} slug    Media library slug
 * @property {string} defaultDisplayName    Library's default display name - used in place of
 *                                          customized name with library owner's name
 * @property {boolean} canUpload    Whether or not the section should include an upload button
 * @property {boolean} shouldDisplayEmpty    Whether or not the section should display if there are no
 *                                           current assets that belong to it
 * @property {string} ownerName    The name of the library owner - an account or business
 * @property {boolean} isInitiallyExpanded    Whether or not the section should be expanded when the UI is loaded
 */
/**
 * @typedef {Object} EditorLibrary
 *
 * @property {string} slug    Media library slug
 * @property {string} displayName    Library's display name in UI
 * @property {boolean} canUpload    Whether or not the section includes an upload button
 * @property {boolean} isInitiallyExpanded    Whether or not the section should be expanded when the UI is loaded
 * @property {Array[ImageAsset]} [imageAssets]    The library's image assets (if ImageLibrary)
 * @property {Array[VideoAsset]} [videoAssets]    The library's video assets (if VideoLibrary)
 */

/**
 * Constructs an array of EditorLibraries based on a list of library configurations.
 *
 *
 * @param {Array[Object]} assets    All image assest that have been loaded during
 *                                       an Editor session
 * @param {Array[LibrarySectionConfig]} sectionConfigs    Library display data
 *
 * @returns {Array[EditorLibrary]}    Formatted EditorLibraries
 */
export const configureMediaLibrarySections = ({
    assets,
    sectionConfigs,
    LibraryModel,
    libraryAssetKey,
    isRemoved = false,
}) => {
    const libraries = [];

    sectionConfigs.forEach(
        ({
            slug,
            defaultDisplayName,
            canUpload = false,
            shouldDisplayEmpty = false,
            ownerName = null,
            isInitiallyExpanded = false,
            shouldDisplaySectionHeader = true,
        }) => {
            // Filter the assets by type and whether or not the library should contain
            // removed assets
            const orderedAssets = getOrderedLibraryAssets(slug, assets, isRemoved);

            // If the library should be displayed no matter what, or the library has assets,
            // it should be dipslayed
            if (shouldDisplayEmpty || !_.isEmpty(orderedAssets)) {
                const displayName = getLibraryDisplayName(defaultDisplayName, ownerName);
                const newLibrary = new LibraryModel({
                    slug,
                    displayName,
                    canUpload,
                    isInitiallyExpanded,
                    shouldDisplaySectionHeader,
                    [libraryAssetKey]: orderedAssets,
                });

                libraries.push(newLibrary);
            }
        },
    );

    return libraries;
};

const ASSET_MODELS_FOR_MEDIA_TYPE = {
    [mediaTypes.footage]: {
        [assetTypes.static]: StaticVideoAsset,
        [assetTypes.stock]: StockVideoAsset,
        [assetTypes.userUpload]: UploadedVideoAsset,
    },
};

/**
 * Convert a dict of raw editor asset data, organized by asset type, into a flat list of EditorAssets.
 *
 * @param {Object} assets    Raw asset data, organized by asset type
 *                           Supported types are searchResult, static, stock, and userUpload
 * @param {string} owner    Entity that owns the editor assets
 *                          Supported owners are account and business
 * @param {string} mediaType    Asset base media type
 *                              Supported types are image and footage
 *
 * @returns {Array[EditorAsset]}    List of formatted EditorAssets
 */
const mapRawDataToEditorAssets = (assets, owner, mediaType) =>
    Object.keys(assets).flatMap((assetType) => {
        const assetsForType = assets[assetType];
        const AssetModel = ASSET_MODELS_FOR_MEDIA_TYPE[mediaType][assetType];

        return assetsForType.map((asset) => new AssetModel({
            owner,
            ...asset
        }));
    });

/**
 * Create a flat list of Editor Assets created from raw asset data.
 * EditorAsset type is determined by media type, asset type, and owner.
 *
 * @param {string} mediaType    Media type - image or footage
 * @param {Object} assets
 * @param {Array[Object]} assets.account    Assets belonging to the current account, oranized by type
 * @param {Array[Object]} assets.business    Assets belonging to the current business, oranized by type
 *
 * @returns {Array[EditorAsset]}    List of formatted EditorAssets
 */
export const createUserEditorAssets = (mediaType, assets = {}) =>
    // [account, business]
    Object.keys(assets).flatMap((assetOwner) =>
        // Create an array of all assets of one type for an owner, e.g. busines stock
        mapRawDataToEditorAssets(assets[assetOwner], assetOwner, mediaType),
    );