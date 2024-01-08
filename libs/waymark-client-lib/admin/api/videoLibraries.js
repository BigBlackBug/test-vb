// Local
import baseAPI from 'shared/api/core/base.js';
/**
 * @typedef {object}  VideoAssetData
 *
 * @property {string} upload_key   Key provided by the VideoProcessingService
 * @property {number} width        The width of the video asset
 * @property {number} height       The height of the video asset
 * @property {number} length       The duration of the video asset in seconds
 */

/**
 * Create a video asset library video.
 *
 * @param {int} videoAssetLibraryID: VideoAssetLibrary ID.
 * @param {Array[VideoAssetData]} videoAssetsData: Data describing video assets for a VideoAssetLibrary.
 */
export const createVideoAssetLibraryVideo = ({
        videoAssetLibraryID,
        videoAssetsData
    }) =>
    baseAPI.post(`video-asset-library-video/create/`, {
        video_asset_library_id: videoAssetLibraryID,
        video_assets_data: videoAssetsData,
    });

/**
 * Remove a video asset library video.
 *
 * @param {int} videoAssetId: ID of the video library asset to delete
 */
export const removeVideoAssetLibraryVideo = (videoAssetId) =>
    baseAPI.delete(`video-asset-library-video/remove/`, {
        video_asset_id: videoAssetId,
    });

/**
 * Patch update a video asset library video with new values
 *
 * @param {int} videoAssetId  ID of the video library asset to update
 * @param {object} videoAssetUpdateData   Object with new values for all fields we want to update on the asset
 */
export const updateVideoAssetLibraryVideo = (videoAssetId, videoAssetUpdateData) =>
    baseAPI.patch(`video-asset-library-video/update/`, {
        video_asset_id: videoAssetId,
        ...videoAssetUpdateData,
    });