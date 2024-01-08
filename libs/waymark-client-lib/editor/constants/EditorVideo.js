// Editor
import {
    baseEditorColorOptions
} from 'editor/constants/EditorColors.js';

const zoomConfigurationPath = 'contentZoom';
const croppingConfigurationPath = 'contentCropping';
const fitConfigurationPath = 'contentFit';
const backgroundFillConfigurationPath = 'contentBackgroundFill';
const paddingConfigurationPath = 'contentPadding';

export const modificationConfigurationPaths = {
    fit: fitConfigurationPath,
    zoom: {
        all: zoomConfigurationPath,
        x: `${zoomConfigurationPath}.x`,
        y: `${zoomConfigurationPath}.y`,
        z: `${zoomConfigurationPath}.z`,
    },
    cropping: {
        all: croppingConfigurationPath,
        x: `${croppingConfigurationPath}.x`,
        y: `${croppingConfigurationPath}.y`,
        width: `${croppingConfigurationPath}.width`,
        height: `${croppingConfigurationPath}.height`,
    },
    padding: paddingConfigurationPath,
    backgroundFill: backgroundFillConfigurationPath,
    trim: {
        startTime: 'contentTrimStartTime',
        duration: 'contentTrimDuration',
    },
    playbackDuration: 'contentPlaybackDuration',
    volume: 'volume',
    isMuted: 'isMuted',

    // Legacy paths that may still be used in some old configurations
    legacy: {
        fit: 'content.modifications.fit',
        backgroundFill: 'content.modifications.backgroundFill',
    },
};

export const fitFillModes = {
    fillContainer: 'crop',
    fitVideo: 'fill',
};

export const defaultFitFillMode = fitFillModes.fillContainer;
export const defaultBackgroundFill = baseEditorColorOptions.black;
export const defaultCropModificationValue = {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
};
export const defaultZoomModificationValue = {
    x: 0.5,
    y: 0.5,
    z: 1,
};
export const defaultPadding = 0;

export const baseDefaultModifications = {
    [modificationConfigurationPaths.trim.startTime]: 0,
    [modificationConfigurationPaths.trim.duration]: undefined,
};

export const defaultFitFillModeModifications = {
    [fitFillModes.fitVideo]: {
        [modificationConfigurationPaths.fit]: fitFillModes.fitVideo,
        [modificationConfigurationPaths.backgroundFill]: defaultBackgroundFill,
        [modificationConfigurationPaths.cropping.all]: defaultCropModificationValue,
        [modificationConfigurationPaths.zoom.all]: undefined,
        [modificationConfigurationPaths.padding]: undefined,
    },
    [fitFillModes.fillContainer]: {
        [modificationConfigurationPaths.fit]: fitFillModes.fillContainer,
        [modificationConfigurationPaths.backgroundFill]: undefined,
        [modificationConfigurationPaths.cropping.all]: undefined,
        [modificationConfigurationPaths.zoom.all]: defaultZoomModificationValue,
        [modificationConfigurationPaths.padding]: defaultPadding,
    },
};

export const videoAssetSources = {
    accountGroup: 'accountGroup',
    shutterstock: 'shutterstock',
    upload: 'upload',
};

export const maxSimultaneousUploadCount = 10;

export const videoAssetPluginType = 'waymark-vps';