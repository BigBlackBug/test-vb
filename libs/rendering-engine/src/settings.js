/**
 * These are the default settings for WaymarkAuthorWebRenderer.
 *
 * They can be set by something like the following:
 * ```
 * WaymarkAuthorWebRenderer.settings.WAYMARK_BFS_HOST = 'https://myfonthost.com/';
 * ```
 */
import _ from 'lodash';

/**
 * The mode in which to run the renderer, with different features enabled in development vs production mode
 *
 * @type {object}
 */
export const mode = {
    development: 'development',
    production: 'production',
};

export const effectQuality = {
    high: 'high',
    medium: 'medium',
    low: 'low',
};

export const assetQuality = {
    high: 'high',
    medium: 'medium',
    low: 'low',
};

export const textureQuality = {
    high: 'high',
    medium: 'medium',
    low: 'low',
};

/**
 * Dictionary of renderer effects.
 * These effects can be disabled by adding them to defaults.DISABLED_EFFECTS.
 *
 * @type {object}
 */
export const effects = {
    motionBlur: 'motionBlur',
    dropShadow: 'dropShadow',
};

export const timeSyncVideoSeekMode = {
    accurate: 'accurate',
    fast: 'fast',
};

export const defaults = {
    WAYMARK_ENVIRONMENT: 'dev',
    ASSET_QUALITY: assetQuality.high,
    DISABLED_EFFECTS: [],
    EFFECT_QUALITY: effectQuality.high,
    IS_ASSET_DATA_WARNINGS_ENABLED: true,
    IS_LOCAL_ASSETS_ENABLED: false,
    IS_DEBUGGING_ENABLED: false,
    MODE: mode.production,
    // Should attempt to fetch encoded footage for a Waymark asset plugin.
    // If true, an encoded filepath will be used instead of the provided key.
    SHOULD_FETCH_ENCODED_WAYMARK_ASSET_PLUGIN_FOOTAGE: true,
    TEXTURE_QUALITY: textureQuality.high,
    TIME_SYNC_VIDEO_SEEK_MODE: timeSyncVideoSeekMode.fast,
    // The prefix for any requests to fetch Waymark fonts
    // TODO: Move into an asset plugin when we switch to bitmap fonts
    WAYMARK_BFS_HOST: 'https://su0gaynrm2.execute-api.us-east-2.amazonaws.com',
    WAYMARK_BFS_S3: 'https://wm-bfs-development.s3.us-east-2.amazonaws.com',
    // Intentionally Ommitted from the default settings as they are a plugin setting.
    // WAYMARK_TEMPLATE_STUDIO_PLUGIN_HOST: null,
    // WAYMARK_DEFAULT_ASSET_PLUGIN_PATH: null,
    // Minimum dimension (w or h) for scaling imgix assets
    // See https://app.clickup.com/t/y7hv0j for context
    MIN_IMGIX_ASSET_DIM: 1024,
    // WAYMARK_DEFAULT_FONT_ID: 'WaymarkVideo__NeueHaasGroteskDisplayPro__n4',
};

const exportedSettings = _.cloneDeep(defaults);

/**
 * The preferred method for updating settings.
 *
 * NOTE: This is not yet propagated in all instances of the renderer's settings getting updated.
 * It was primarily needed to avoid errors in Typescript files (TS2708) that were importing the settings object.
 * @param {object} newSettings
 */
export const updateSettings = (newSettings) => {
    Object.entries(newSettings).forEach(([settingName, settingValue]) => {
        exportedSettings[settingName] = settingValue;
    });
};

// The intention of cloning here is to preserve defaults for reference (e.g. setting tests back to defaults)
export default exportedSettings;