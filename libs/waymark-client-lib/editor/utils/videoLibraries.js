// Local
import {
    mediaLibrarySlugs
} from 'editor/constants/mediaLibraries.js';
import {
    getOrderedLibraryAssets,
    configureMediaLibrarySections,
} from 'editor/utils/mediaLibraries.js';
import StaticVideoAsset from 'app/models/StaticVideoAsset.js';
import VideoLibrary from 'app/models/VideoLibrary.js';

/**
 * Converts all static video asset data in a group of libraries to
 * StaticVideoAsset instances.
 *
 * @param {Array[Object]} staticVideoLibraryData
 */
export const createStaticVideoAssets = (staticVideoLibraryData) =>
    staticVideoLibraryData.map((libraryData) => ({
        ...libraryData,
        videoAssets: libraryData.videoAssets.map((asset) => new StaticVideoAsset(asset)),
        isInitiallyExpanded: false,
        shouldDisplaySectionHeader: true,
    }));

const DEFAULT_VIDEO_LIBRARY_NAMES = {
    [mediaLibrarySlugs.accountAll]: 'My Footage',
    [mediaLibrarySlugs.accountStock]: 'Stock Footage',
    [mediaLibrarySlugs.accountUploads]: 'My Uploads',
    [mediaLibrarySlugs.businessAll]: 'Brand Footage',
    [mediaLibrarySlugs.businessStock]: 'Stock Footage',
    [mediaLibrarySlugs.businessUploads]: 'Brand Uploads',
};

/**
 * Constructs an array of VideoLibrary instances for a set of library section configurations.
 *
 * @param {Array[Object]} videoAssets    All video assest that have been loaded during
 *                                       an Editor session
 * @param {Array[LibrarySectionConfig]} sectionConfigs    Library display data
 * @returns {Array[VideoLibrary]}
 */
export const configureVideoLibrarySections = (videoAssets, sectionConfigs, isRemoved = false) =>
    configureMediaLibrarySections({
        assets: videoAssets,
        sectionConfigs: sectionConfigs.map((section) => ({
            ...section,
            defaultDisplayName: DEFAULT_VIDEO_LIBRARY_NAMES[section.slug],
        })),
        LibraryModel: VideoLibrary,
        libraryAssetKey: 'videoAssets',
        isRemoved,
    });