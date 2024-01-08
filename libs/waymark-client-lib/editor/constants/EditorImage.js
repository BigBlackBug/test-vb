// Editor
import {
    baseEditorColorOptions
} from 'editor/constants/EditorColors.js';

/* WAYMARK APP DEPENDENCIES */
import {
    clamp,
    toPrecision,
    translateValueToRange,
} from 'shared/utils/math.js';
import {
    cssColorToImgixColor,
    imgixColorToCssColor,
} from 'shared/utils/colors.js';
/* END WAYMARK APP DEPENDENCIES */

export const CroppingMinValue = 0.0001;
export const CroppingMaxValue = 0.9999;
export const PaddingMinValue = 0.0001;

export const FitFillModes = {
    fillContainer: 'crop',
    fitImage: 'fill',
};

export const ImageModificationKeys = {
    adjustments: 'adjustments',
    // "all" key represents scenarios where we want to update the entire modification object
    all: 'all',
    backgroundFill: 'backgroundFill',
    cropping: 'cropping',
    fit: 'fit',
    padding: 'padding',
    fillColor: 'fillColor',
    // zoom
    zoom: 'zoom',
    zoomX: 'zoomX',
    zoomY: 'zoomY',
    zoomZ: 'zoomZ',
    // adjustments
    blur: 'blur',
    brightness: 'brightness',
    contrast: 'contrast',
    duotone: 'duotone',
    duotoneAlpha: 'duotoneAlpha',
    exposure: 'exposure',
    highlight: 'highlight',
    monochrome: 'monochrome',
    noiseReduction: 'noiseReduction',
    noiseReductionSharpen: 'noiseReductionSharpen',
    saturation: 'saturation',
    shadow: 'shadow',
    sharpen: 'sharpen',
    unsharpMask: 'unsharpMask',
    vibrance: 'vibrance',
};

const IMGIX_FULL_RANGE = [-1, 1];
const IMGIX_POSITIVE_VALUES_RANGE = [0, 1];
const IMGIX_NEGATIVE_VALUES_RANGE = [-1, 0];
const WAYMARK_FULL_RANGE = [-100, 100];
const WAYMARK_POSITIVE_VALUES_RANGE = [0, 100];
const WAYMARK_NEGATIVE_VALUES_RANGE = [-100, 0];

export const ImageModifications = {
    // start adjustments
    [ImageModificationKeys.blur]: {
        path: 'adjustments.blur',
        queryParam: 'blur',
        // Imgix accepted blur values range from 0 - 2000 and the normalized values in the
        // renderer range from 0 - 1000, which is different than most of our other adjustments
        // whose normalized values range from -1 to 1.
        toWaymarkValue: (value) => +value / 2,
        toImgixValue: (value) => value * 2,
    },
    [ImageModificationKeys.brightness]: {
        path: 'adjustments.brightness',
        queryParam: 'bri',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.contrast]: {
        path: 'adjustments.contrast',
        queryParam: 'con',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.duotone]: {
        path: 'adjustments.duotone',
        queryParam: 'duotone',
        toWaymarkValue: (value) => {
            const colorArray = typeof value === 'string' ? value.split(',') : value;
            return colorArray.map((color) => imgixColorToCssColor(color));
        },
        toImgixValue: (value) => value.map((color) => cssColorToImgixColor(color)),
    },
    [ImageModificationKeys.duotoneAlpha]: {
        path: 'adjustments.duotoneAlpha',
        queryParam: 'duotone-alpha',
        toWaymarkValue: (value) =>
            translateValueToRange(
                value,
                WAYMARK_POSITIVE_VALUES_RANGE,
                IMGIX_POSITIVE_VALUES_RANGE,
                2
            ),
        toImgixValue: (value) =>
            translateValueToRange(
                value,
                IMGIX_POSITIVE_VALUES_RANGE,
                WAYMARK_POSITIVE_VALUES_RANGE,
                2
            ),
    },
    [ImageModificationKeys.exposure]: {
        path: 'adjustments.exposure',
        queryParam: 'exp',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.highlight]: {
        path: 'adjustments.highlight',
        queryParam: 'high',
        toWaymarkValue: (value) =>
            translateValueToRange(
                value,
                WAYMARK_NEGATIVE_VALUES_RANGE,
                IMGIX_NEGATIVE_VALUES_RANGE,
                2
            ),
        toImgixValue: (value) =>
            translateValueToRange(
                value,
                IMGIX_NEGATIVE_VALUES_RANGE,
                WAYMARK_NEGATIVE_VALUES_RANGE,
                2
            ),
    },
    [ImageModificationKeys.monochrome]: {
        path: 'adjustments.monochrome',
        queryParam: 'monochrome',
        toWaymarkValue: (value) => imgixColorToCssColor(value),
        toImgixValue: (value) => cssColorToImgixColor(value),
    },
    [ImageModificationKeys.noiseReduction]: {
        path: 'adjustments.noiseReduction',
        queryParam: 'nr',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.noiseReductionSharpen]: {
        path: 'adjustments.noiseReductionSharpen',
        queryParam: 'nrs',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.saturation]: {
        path: 'adjustments.saturation',
        queryParam: 'sat',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.shadow]: {
        path: 'adjustments.shadow',
        queryParam: 'shad',
        toWaymarkValue: (value) =>
            translateValueToRange(
                value,
                WAYMARK_POSITIVE_VALUES_RANGE,
                IMGIX_POSITIVE_VALUES_RANGE,
                2
            ),
        toImgixValue: (value) =>
            translateValueToRange(
                value,
                IMGIX_POSITIVE_VALUES_RANGE,
                WAYMARK_POSITIVE_VALUES_RANGE,
                2
            ),
    },
    [ImageModificationKeys.sharpen]: {
        path: 'adjustments.sharpen',
        queryParam: 'sharp',
        toWaymarkValue: (value) =>
            translateValueToRange(
                value,
                WAYMARK_POSITIVE_VALUES_RANGE,
                IMGIX_POSITIVE_VALUES_RANGE,
                2
            ),
        toImgixValue: (value) =>
            translateValueToRange(
                value,
                IMGIX_POSITIVE_VALUES_RANGE,
                WAYMARK_POSITIVE_VALUES_RANGE,
                2
            ),
    },
    [ImageModificationKeys.unsharpMask]: {
        path: 'adjustments.unsharpMask',
        queryParam: 'usm',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    [ImageModificationKeys.vibrance]: {
        path: 'adjustments.vibrance',
        queryParam: 'vib',
        toWaymarkValue: (value) =>
            translateValueToRange(value, WAYMARK_FULL_RANGE, IMGIX_FULL_RANGE, 2),
        toImgixValue: (value) =>
            translateValueToRange(value, IMGIX_FULL_RANGE, WAYMARK_FULL_RANGE, 2),
    },
    // end adjustments
    [ImageModificationKeys.cropping]: {
        path: 'cropping',
        queryParam: 'rect',
        toWaymarkValue: (value) => {
            if (typeof value === 'string') {
                // Imgix query string --> Waymark modifications cropping object
                const [x, y, width, height] = value.split(',');

                return {
                    x: parseFloat(x),
                    y: parseFloat(y),
                    width: parseFloat(width),
                    height: parseFloat(height),
                };
            }

            // Image cropper values --> Waymark modifications cropping object
            const clampCroppingValue = (croppingValue) =>
                clamp(parseFloat(croppingValue), CroppingMinValue, CroppingMaxValue);

            const croppingObj = {};
            Object.keys(value).forEach((croppingKey) => {
                croppingObj[croppingKey] = clampCroppingValue(value[croppingKey]);
            });

            return croppingObj;
        },
        // Waymark modifications cropping object --> Imgix query string
        toImgixValue: (value) => {
            // Ensure value is clamped between 0-1 (exclusive) and limit to only 4 decimal points
            // of precision and remove the leading "0" from each number - in order to use relative
            // crop sizing with percentage units from 0-1 only, imgix requires that there be no
            // leading 0s
            const rectParamValues = [value.x, value.y, value.width, value.height].map(
                (croppingValue) => croppingValue.toFixed(4).slice(1)
            );

            return rectParamValues.join(',');
        },
    },
    [ImageModificationKeys.fillColor]: {
        path: 'fillColor',
        queryParam: 'fill-color',
        toWaymarkValue: (value) => imgixColorToCssColor(value),
        toImgixValue: (value) => cssColorToImgixColor(value),
    },
    [ImageModificationKeys.backgroundFill]: {
        path: 'backgroundFill',
        queryParam: 'bg',
        toWaymarkValue: (value) => imgixColorToCssColor(value),
        toImgixValue: (value) => cssColorToImgixColor(value),
    },
    [ImageModificationKeys.fit]: {
        path: 'fit',
        queryParam: 'fit',
        toWaymarkValue: (value) => value,
        toImgixValue: (value) => value,
    },
    [ImageModificationKeys.padding]: {
        path: 'padding',
        queryParam: 'pad',
        toWaymarkValue: (value) => +value,
        toImgixValue: (value) => value,
    },
    // zoom
    [ImageModificationKeys.zoomX]: {
        path: 'zoom.x',
        queryParam: 'fp-x',
        toWaymarkValue: (value) => toPrecision(parseFloat(value), 2),
        toImgixValue: (value) => value.toFixed(4).slice(1),
    },
    [ImageModificationKeys.zoomY]: {
        path: 'zoom.y',
        queryParam: 'fp-y',
        toWaymarkValue: (value) => toPrecision(parseFloat(value), 2),
        toImgixValue: (value) => value.toFixed(4).slice(1),
    },
    [ImageModificationKeys.zoomZ]: {
        path: 'zoom.z',
        queryParam: 'fp-z',
        toWaymarkValue: (value) => parseFloat(value),
        toImgixValue: (value) => value,
    },
};

// By default unless otherwise specified, the renderer uses "fit image" for images
export const defaultFitFillMode = FitFillModes.fitImage;

export const DefaultImageModifications = {
    [FitFillModes.fillContainer]: {
        [ImageModificationKeys.fit]: FitFillModes.fillContainer,
        [ImageModificationKeys.zoom]: {
            z: 1,
            x: 0.5,
            y: 0.5,
        },
    },
    [FitFillModes.fitImage]: {
        [ImageModificationKeys.fit]: FitFillModes.fitImage,
        [ImageModificationKeys.cropping]: {
            x: CroppingMinValue,
            y: CroppingMinValue,
            width: CroppingMaxValue,
            height: CroppingMaxValue,
        },
        [ImageModificationKeys.backgroundFill]: baseEditorColorOptions.transparent,
        [ImageModificationKeys.fillColor]: baseEditorColorOptions.transparent,
        [ImageModificationKeys.padding]: PaddingMinValue,
    },
};

export const imageFilters = [{
        label: 'Normal',
        adjustments: {},
    },
    {
        label: 'Vibrant',
        adjustments: {
            [ImageModificationKeys.brightness]: 8,
            [ImageModificationKeys.contrast]: 12,
            [ImageModificationKeys.highlight]: -6,
            [ImageModificationKeys.saturation]: 32,
            [ImageModificationKeys.noiseReduction]: 24,
            [ImageModificationKeys.noiseReductionSharpen]: 12,
            [ImageModificationKeys.vibrance]: 12,
        },
    },
    {
        label: 'Brighten',
        adjustments: {
            [ImageModificationKeys.brightness]: 16,
            [ImageModificationKeys.contrast]: -2,
            [ImageModificationKeys.exposure]: 1,
            [ImageModificationKeys.saturation]: 6,
        },
    },
    {
        label: 'Darken',
        adjustments: {
            [ImageModificationKeys.brightness]: -6,
            [ImageModificationKeys.contrast]: 8,
            [ImageModificationKeys.exposure]: -1,
            [ImageModificationKeys.saturation]: 6,
        },
    },
    {
        label: 'Cool',
        adjustments: {
            [ImageModificationKeys.contrast]: 8,
            [ImageModificationKeys.duotone]: ['151C54', '2CA4F0D9'],
            [ImageModificationKeys.duotoneAlpha]: 35,
        },
    },
    {
        label: 'Dark Overlay',
        adjustments: {
            [ImageModificationKeys.brightness]: -12,
            [ImageModificationKeys.contrast]: -40,
            [ImageModificationKeys.exposure]: -4,
            [ImageModificationKeys.monochrome]: '50333333',
        },
    },
    {
        label: 'Light Blur',
        adjustments: {
            [ImageModificationKeys.blur]: 40,
        },
    },
    {
        label: 'Heavy Blur',
        adjustments: {
            [ImageModificationKeys.blur]: 200,
        },
    },
    {
        label: "70's Vintage",
        adjustments: {
            [ImageModificationKeys.brightness]: 3,
            [ImageModificationKeys.contrast]: -12,
            [ImageModificationKeys.duotone]: ['58641D', '2CE8964A'],
            [ImageModificationKeys.duotoneAlpha]: 24,
            [ImageModificationKeys.saturation]: 24,
        },
    },
    {
        label: "80's Vintage",
        adjustments: {
            [ImageModificationKeys.contrast]: 12,
            [ImageModificationKeys.duotone]: ['00D7DD', '2CFF1988'],
            [ImageModificationKeys.duotoneAlpha]: 32,
            [ImageModificationKeys.saturation]: 32,
        },
    },
    {
        label: 'Filmic',
        adjustments: {
            [ImageModificationKeys.brightness]: 3,
            [ImageModificationKeys.contrast]: 24,
            [ImageModificationKeys.saturation]: -32,
        },
    },
    {
        label: 'Faded Monochrome',
        adjustments: {
            [ImageModificationKeys.brightness]: 12,
            [ImageModificationKeys.contrast]: -20,
            [ImageModificationKeys.duotone]: ['000', 'FFFFFF'],
            [ImageModificationKeys.duotoneAlpha]: 100,
        },
    },
    {
        label: 'Dramatic Monochrome',
        adjustments: {
            [ImageModificationKeys.contrast]: 100,
            [ImageModificationKeys.duotone]: ['000', 'FFFFFF'],
            [ImageModificationKeys.duotoneAlpha]: 100,
            [ImageModificationKeys.highlight]: -50,
        },
    },
    {
        label: 'Poster',
        adjustments: {
            [ImageModificationKeys.contrast]: 100,
            [ImageModificationKeys.duotone]: ['000', 'FFFEFA'],
            [ImageModificationKeys.duotoneAlpha]: 100,
        },
    },
    {
        label: 'Sepia',
        adjustments: {
            [ImageModificationKeys.contrast]: 12,
            [ImageModificationKeys.duotone]: ['30160F', 'FFFDF2'],
            [ImageModificationKeys.duotoneAlpha]: 100,
        },
    },
    {
        label: 'Silver',
        adjustments: {
            [ImageModificationKeys.brightness]: 4,
            [ImageModificationKeys.contrast]: 32,
            [ImageModificationKeys.duotone]: ['1B2123', 'FFFFFF'],
            [ImageModificationKeys.duotoneAlpha]: 100,
        },
    },
];

export const maxSimultaneousUploadCount = 20;