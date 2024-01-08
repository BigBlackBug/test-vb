/**
 * asset.modifications.fit values
 */
export const waymarkAssetModificationFits = {
    fill: 'fill',
    // 'crop' matches the provided width/height without skewing the image
    // https://docs.imgix.com/apis/url/size/fit#crop
    crop: 'crop',
};

/**
 * asset.modifications.timecodeScaleMode values
 */
export const timecodeScaleMode = {
    // Timecode has a fixed size regardless of video resolution.
    // Sometimes video files are downscaled to reduce storage and bandwidth, but a
    // 'fixed' timecode will not be downscaled relative to the video.
    fixed: 'fixed',
    // Timecode has a relative size. If the video is downscaled, the timecode is
    // as well.
    relative: 'relative',
};

/**
 * asset.modifications.timecodeSettings.timecodePlacement values
 * Only 'bottom' is supported right now.
 */
export const timecodePlacement = {
    bottom: 'bottom',
};

/**
 * asset.modifications.videoAssetHeightMode values
 */
export const videoAssetHeightMode = {
    // The project manifest JSON contains a 'height' value for each video asset.
    // 'assetOnly' means the value represents the height of the video content,
    // and not any encoded data (such as a timecode).
    assetOnly: 'assetOnly',
    // 'assetWithPadding' means the JSON height value includes some additional
    // content such as a timecode.
    assetWithPadding: 'assetWithPadding',
};

/*
Waymark supported video asset `modifications` object.
{
  startFrame,       // [0, ]
}
*/
export const waymarkVideoAssetModificationsSchema = {
    title: 'Waymark video asset modifications schema',
    definitions: {},
    type: 'object',
    properties: {
        startFrame: {
            $id: '#root/startFrame',
            title: 'Start frame',
            type: 'number',
            minimum: 0,
        },
        audio: {
            $id: '#root/audio',
            title: 'Audio',
            type: 'object',
            properties: {
                isMuted: {
                    $id: '#root/audio/isMuted',
                    type: 'boolean',
                    title: 'Is Muted',
                },
            },
            additionalProperties: false,
        },
        hasTimecode: {
            $id: '#root/hasTimecode',
            title: 'Has timecode',
            type: 'boolean',
        },
        shouldUseTimecode: {
            $id: '#root/shouldUseTimecode',
            title: 'Should use timecode',
            type: 'boolean',
        },
        videoAssetHeightMode: {
            $id: '#root/videoAssetHeightMode',
            title: 'Video asset height mode',
            type: 'string',
            oneOf: [{
                    const: videoAssetHeightMode.assetOnly
                },
                {
                    const: videoAssetHeightMode.assetWithPadding
                },
            ],
        },
        videoAssetHeightPadding: {
            $id: '#root/videoAssetHeightPadding',
            title: 'Video asset height padding for videoAssetHeightMode === assetWithPadding',
            type: 'number',
            minimum: 0,
        },
        timecodeScaleMode: {
            $id: '#root/timecodeScaleMode',
            title: 'Timecode scale mode',
            type: 'string',
            oneOf: [{
                const: timecodeScaleMode.fixed
            }, {
                const: timecodeScaleMode.relative
            }],
        },
        timecodeSettings: {
            $id: '#root/timecodeSettings',
            title: 'Timecode settings',
            type: 'object',
            properties: {
                timecodeDigitCount: {
                    $id: '#root/timecodeSettings/timecodeDigitCount',
                    title: 'Timecode digit count',
                    type: 'number',
                    minimum: 0,
                },
                timecodeDigitHeight: {
                    $id: '#root/timecodeSettings/timecodeDigitHeight',
                    title: 'Timecode digit height',
                    type: 'number',
                    minimum: 0,
                },
                timecodeDigitWidth: {
                    $id: '#root/timecodeSettings/timecodeDigitWidth',
                    title: 'Timecode digit width',
                    type: 'number',
                    minimum: 0,
                },
                timecodePlacement: {
                    $id: '#root/timecodeSettings/timecodePlacement',
                    title: 'Timecode digit placement',
                    type: 'string',
                    oneOf: [{
                        const: timecodePlacement.bottom
                    }],
                },
                timecodePaddingTop: {
                    $id: '#root/timecodeSettings/timecodePaddingTop',
                    title: 'Timecode padding top',
                    type: 'number',
                    minimum: 0,
                },
            },
            required: [
                'timecodeDigitCount',
                'timecodeDigitHeight',
                'timecodeDigitWidth',
                'timecodePlacement',
            ],
        },
    },
    additionalProperties: false,
};

/*
Waymark supported image asset `modifications` object.
{
  fit,              // ['fill', 'crop']
  backgroundFill,   // 3- (RGB), 6- (RRGGBB) or 8-digit (AARRGGBB) Imgix values
  padding,          // [0, 250];   Imgix: [0, 500]
  cropping: {
    x,
    y,
    width,
    height,
  },
  zoom: {
    x,              // [0, 1];     Imgix: [0, 1]
    y,              // [0, 1];     Imgix: [0, 1]
    z,              // [1, 100];   Imgix: [1, 100]
  },
  adjustments: {
    blur,           // [0, 1000];     Imgix: [0, 2000]
    brightness,     // [-1, 1];    Imgix: [-100, 100]
    contrast,       // [-1, 1];    Imgix: [-100, 100]
    duotone,        // 3- (RGB), 6- (RRGGBB) or 8-digit (AARRGGBB) Imgix values
    duotoneAlpha,   // [0, 1];     Imgix: [0, 100]
    exposure,       // [-1, 1];    Imgix: [-100, 100]
    highlight,      // [-1, 0];    Imgix: [-100, 0]
    monochrome,     // 3- (RGB), 6- (RRGGBB) or 8-digit (AARRGGBB) Imgix values
    saturation,     // [-1, 1];    Imgix: [-100, 100]
    shadow,         // [0, 1];     Imgix: [0, 100]
    sharpen,        // [0, 1];     Imgix: [0, 100]
    unsharpMask,    // [-1, 1];    Imgix: [-100, 100]
  }
}
*/
export const waymarkImageAssetModificationsSchema = {
    title: 'Waymark image asset modifications schema',
    definitions: {},
    type: 'object',
    properties: {
        adjustments: {
            $id: '#root/adjustments',
            title: 'Adjustments',
            type: 'object',
            properties: {
                noiseReduction: {
                    $id: '#root/adjustments/noiseReduction',
                    title: 'Noise reduction',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                noiseReductionSharpen: {
                    $id: '#root/adjustments/noiseReductionSharpen',
                    title: 'Noise reduction sharpen',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                blur: {
                    $id: '#root/adjustments/blur',
                    title: 'Blur',
                    type: 'number',
                    minimum: 0,
                    maximum: 1000,
                },
                brightness: {
                    $id: '#root/adjustments/brightness',
                    title: 'Brightness',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                contrast: {
                    $id: '#root/adjustments/contrast',
                    title: 'Contrast',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                duotone: {
                    $id: '#root/adjustments/duotone',
                    title: 'Duotone',
                    type: 'array',
                    items: {
                        type: 'string',
                        minItems: 2,
                        maxItems: 2,
                    },
                },
                duotoneAlpha: {
                    $id: '#root/adjustments/duotoneAlpha',
                    title: 'Duotone alpha',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
                exposure: {
                    $id: '#root/adjustments/exposure',
                    title: 'Exposure',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                highlight: {
                    $id: '#root/adjustments/highlight',
                    title: 'Highlight',
                    type: 'number',
                    minimum: -1,
                    maximum: 0,
                },
                monochrome: {
                    $id: '#root/adjustments/monochrome',
                    title: 'Monochrome',
                    type: 'string',
                },
                saturation: {
                    $id: '#root/adjustments/saturation',
                    title: 'Saturation',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                shadow: {
                    $id: '#root/adjustments/shadow',
                    title: 'Shadow',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
                sharpen: {
                    $id: '#root/adjustments/sharpen',
                    title: 'Sharpen',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
                unsharpMask: {
                    $id: '#root/adjustments/unsharpMask',
                    title: 'Unsharp mask',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
                vibrance: {
                    $id: '#root/adjustments/vibrance',
                    title: 'Vibrance',
                    type: 'number',
                    minimum: -1,
                    maximum: 1,
                },
            },
            additionalProperties: false,
        },
        backgroundFill: {
            $id: '#root/backgroundFill',
            title: 'Background fill',
            type: 'string',
        },
        cropping: {
            $id: '#root/cropping',
            title: 'Cropping',
            type: 'object',
            properties: {
                x: {
                    $id: '#root/cropping/x',
                    title: 'Cropping x',
                    type: 'number',
                },
                y: {
                    $id: '#root/cropping/y',
                    title: 'Cropping y',
                    type: 'number',
                },
                width: {
                    $id: '#root/cropping/width',
                    title: 'Cropping width',
                    type: 'number',
                },
                height: {
                    $id: '#root/cropping/height',
                    title: 'Cropping height',
                    type: 'number',
                },
            },
            required: ['x', 'y', 'width', 'height'],
            additionalProperties: false,
        },
        fillColor: {
            $id: '#root/fillColor',
            title: 'Fill Color',
            type: 'string',
            const: '#ffffff00',
        },
        fit: {
            $id: '#root/fit',
            title: 'Fit',
            type: 'string',
            default: waymarkAssetModificationFits.crop,
            oneOf: [{
                    const: waymarkAssetModificationFits.crop
                },
                {
                    const: waymarkAssetModificationFits.fill
                },
            ],
        },
        padding: {
            $id: '#root/padding',
            title: 'Padding',
            type: 'number',
            minimum: 0,
            maximum: 500,
        },
        zoom: {
            $id: '#root/zoom',
            title: 'Zoom',
            type: 'object',
            properties: {
                x: {
                    $id: '#root/zoom/x',
                    title: 'Zoom x (focal point x)',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
                y: {
                    $id: '#root/zoom/y',
                    title: 'Zoom y (focal point y)',
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                },
                z: {
                    $id: '#root/zoom/z',
                    title: 'Zoom z (focal point z)',
                    type: 'number',
                    minimum: 1,
                    maximum: 100,
                },
            },
            required: ['x', 'y', 'z'],
            additionalProperties: false,
        },
    },
    additionalProperties: false,
};