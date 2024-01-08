import _ from 'lodash';
import {
    effectQuality,
    assetQuality,
    effects,
    initialSettings,
    timeSyncVideoSeekMode,
} from 'shared/WaymarkAuthorWebRenderer.js';

const defaultSettings = {
    ...initialSettings,
    // Disable assetData warnings. assetData missing type warnings may flood the console for
    // pre-template-studio publishes.
    IS_ASSET_DATA_WARNINGS_ENABLED: false,
};

export const assetExportSettings = {
    ..._.cloneDeep(defaultSettings),
    // Maximum quality effects for asset export rendering
    ASSET_QUALITY: assetQuality.high,
    EFFECT_QUALITY: effectQuality.high,
    TIME_SYNC_VIDEO_SEEK_MODE: timeSyncVideoSeekMode.accurate,
};

export const desktopBrowserSettings = {
    ..._.cloneDeep(defaultSettings),
    // Low quality effects for desktop browser rendering
    ASSET_QUALITY: assetQuality.medium,
    EFFECT_QUALITY: effectQuality.low,
};

export const mobileBrowserSettings = {
    ..._.cloneDeep(defaultSettings),
    // Low quality effects and disabled motion blur for mobile rendering
    // TODO: Determine if motion blur should be disabled for mobile an a per-template basis
    ASSET_QUALITY: assetQuality.medium,
    EFFECT_QUALITY: effectQuality.low,
    DISABLED_EFFECTS: [effects.motionBlur],
};