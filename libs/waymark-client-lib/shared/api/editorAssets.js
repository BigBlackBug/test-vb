// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

/**
 * GET `/video-asset-libraries/`
 * Fetches one or more video asset libraries by slug.
 *
 * @param {string[]}  videoAssetLibrarySlugs
 * @return {object[]} Serialized VideoAssetLibrary records.
 */
export const fetchVideoAssetLibraries = (videoAssetLibrarySlugs) => {
    const url = addQueryParametersToURL('video-asset-libraries/', {
        library_slugs: videoAssetLibrarySlugs,
    });

    return baseAPI.get(url);
};

/**
 * GET `/video-template-global-audio-libraries`
 * Fetches all global audio libraries.
 *
 * @return {object}  Serialized VideoTemplateGlobalAudioLibrary records.
 */
export const fetchGlobalAudioLibraries = () =>
    baseAPI.get('video-template-global-audio-libraries/');

/**
 * GET `/global-font-libraries`
 * Fetches all global font libraries.
 *
 * @return {object}  Serialized GlobalFontLibrary records.
 */
export const fetchGlobalFontLibraries = () => baseAPI.get('global-font-libraries/');

/**
 * GET `/video-template-variant-audio`
 * Fetches the video template variant audio library for a given video template variant.
 * @param {string} videoTemplateVariantSlug    Compount VideoTemplateVariant slug.
 * @return {object}                            Serialized VideoTemplateVariantAudio records.
 */
export const fetchVideoTemplateVariantAudio = (videoTemplateVariantSlug) => {
    const url = addQueryParametersToURL('video-template-variant-audio/', {
        video_template_variant_slug: videoTemplateVariantSlug,
    });

    return baseAPI.get(url);
};

/**
 * POST `/account-video-assets/`
 *
 * Create AccountVideoAsset record from a payload containing an account guid, video upload API key, and additional video metadata.
 *
 * @param {string}  accountGUID     GUID of account creating the video asset.
 * @param {string}  uploadKey       Upload API reference key.
 * @param {object}  videoMetadata   Object containing metatdata about the video like width, height, and length.
 */
export const createAccountVideoAsset = (accountGUID, uploadKey, videoMetadata = {}) => {
    const url = 'account-video-assets/';

    return baseAPI.post(url, {
        account_guid: accountGUID,
        upload_key: uploadKey,
        width: videoMetadata.width,
        height: videoMetadata.height,
        length: videoMetadata.duration,
    });
};

/**
 * GET `/account-video-assets/`
 *
 * List AccountVideoAsset records associated with an account.
 *
 * @param {string}  accountGUID     Account to list video assets for.
 */
export const fetchAccountVideoAssets = (accountGUID) => {
    const url = addQueryParametersToURL('account-video-assets/', {
        account_guid: accountGUID
    });
    return baseAPI.get(url);
};

/**
 * DELETE `/account-video-assets/remove/`
 *
 * Remove AccountVideoAsset record for the given video asset GUID.
 *
 * @param {string}  videoAssetGUID   GUID of the AccountVideoAsset to remove.
 */
export const removeAccountVideoAsset = (videoAssetGUID) => {
    const url = 'account-video-assets/remove/';

    return baseAPI.delete(url, {
        video_asset_guid: videoAssetGUID,
    });
};

/**
 * POST `/account-video-assets/restore/`
 *
 * Restore a deleted AccountVideoAsset record for the given video asset GUID.
 *
 * @param {string}  videoAssetGUID   GUID of the AccountVideoAsset to restore.
 */
export const restoreAccountVideoAsset = (videoAssetGUID) => {
    const url = 'account-video-assets/restore/';

    return baseAPI.post(url, {
        video_asset_guid: videoAssetGUID,
    });
};

/**
 * POST `/account-audio-assets/`
 *
 * Create AccountAudioAsset record from a payload containing an account guid, audio upload API key, and additional audio metadata
 *
 * @param {string}  accountGUID     GUID of account creating the audio asset
 * @param {string}  uploadKey       Upload API reference key
 * @param {object}  audioMetadata   Object containing metatdata about the audio like length and file name
 */
export const createAccountAudioAsset = (accountGUID, uploadKey, audioMetadata = {}) =>
    baseAPI.post('account-audio-assets/', {
        account_guid: accountGUID,
        upload_key: uploadKey,
        length: audioMetadata.duration,
        display_name: audioMetadata.displayName,
        source: audioMetadata.source,
    });

/**
 * GET `/account-audio-assets/`
 *
 * List AccountAudioAsset records associated with an account.
 *
 * @param {string} accountGUID GUID for account to fetch assets for
 */
export const fetchAccountAudioAssets = (accountGUID) =>
    baseAPI.get(addQueryParametersToURL('account-audio-assets/', {
        account_guid: accountGUID
    }));

/**
 * DELETE `/account-audio-assets/remove/`
 *
 * Remove AccountAudioAsset record for the given audio asset GUID
 *
 * @param {string}  audioAssetGUID   GUID of the AccountAssetAsset to remove
 */
export const removeAccountAudioAsset = (audioAssetGUID) =>
    baseAPI.delete('account-audio-assets/remove/', {
        audio_asset_guid: audioAssetGUID,
    });

/**
 * POST `/account-audio-assets/restore/`
 *
 * Restore a deleted AccountAudioAsset record for the given audio asset GUID.
 *
 * @param {string}  audioAssetGUID   GUID of the AccountAudioAsset to restore.
 */
export const restoreAccountAudioAsset = (audioAssetGUID) =>
    baseAPI.post('account-audio-assets/restore/', {
        audio_asset_guid: audioAssetGUID,
    });