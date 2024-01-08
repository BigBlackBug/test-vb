/* eslint-disable no-param-reassign, jsdoc/no-undefined-types */
// Vendor
import _ from 'lodash';
import {
    WMBitmapText,
    TextStyle,
    getFallbackFontCollection
} from 'pixi.js';

// Local
import {
    formatFontAssetId,
    getInitialProperties
} from '../../manifest/index.js';
import {
    applyDisplayObjectProperties,
    applyProperty,
    loadAssetForLayer,
    loadAsset,
    loadUrl,
    setDirty,
} from '../utils/index.js';
import {
    applyTween
} from '../tweens.js';
import waymarkAuthorCustomProperties from '../waymarkAuthorCustomProperties.js';
import {
    createTextAnimatorFromData
} from './textAnimators.js';
import {
    applyTextStylePropertiesToText
} from './textStyle.js';

export {
    getResizingStrategyFromMetadata
}
from './utils.js';

/**
 *  These are the names of custom properties for text objects  we create for our
 *  custom PIXI application. These should be assumed to be a standard
 *  contract across our use in the application, so make sure to write a note about what
 *  each property is used for.
 */
export const waymarkTextCustomProperties = {
    // When a font property for a text style changes, we need to re calculate the resolution of a text object
    onFontPropertyChange: 'onFontPropertyChange',
    // When the content of a text object changes, we need to re calculate the resolution of a text object
    onTextContentChange: 'onTextContentChange',
    // When the fill color of an object changes and we create a new layer, we have to recalculate the best font size
    onFillColorChange: 'onFillColorChange',
};

/**
 * Apply text properties from the Bodymovin export to a TextStyle object
 *
 * @param      {pixi.js.Text}       text                   The Text object
 * @param      {object}             textPropertyKeyframes  An object of transform properties exported from bodymovin.
 *                                                         This should be in the data.json text "t" member keyframe format.
 * @param      {Timeline}  timeline               The timeline (for animations)
 * @param      {object}             metadata               The Layer metadata
 * @returns {string[]} An array of strings that the text object will show over the course of its life that need to be prepared. Ex: ['hello', 'world']
 */
export function applyTextPropertiesToText(text, textPropertyKeyframes, timeline, metadata = {}) {
    // Text Keyframes are a little weird in that they are structured with the entire start value as
    // a single object and they are always considered animated (the "a" key does not exist)
    // They also do not posess the ability to be eased, and are effectively hold interpolation always
    //
    // Example:
    // [
    //   {
    //    "s": {
    //      ...styleProperties
    //    },
    //    "t": 0
    //   },
    // ]
    //
    // We are going to convert this to a format more like the rest of the tweens
    //
    // [
    //   {
    //    "s": [10],
    //    "h": 1,
    //    "t": 0,
    //   },
    // ]
    //

    const formattedKeyframes = {};
    const textContentToPrepare = [];

    textPropertyKeyframes.forEach((textPropertyKeyframe, index) => {
        // The text content ex: "Hello this is my text"
        let textContent;
        // If it is an object, it will also contain a mixture of text styles and text conten
        if (_.isObject(textPropertyKeyframe)) {
            textContent = _.get(textPropertyKeyframe, 's.t');
            // Otherwise it just contains the text content
        } else {
            textContent = textPropertyKeyframe;
        }

        textContentToPrepare.push(textContent);

        // Set the initial value
        if (index === 0) {
            text.text = textContent;
        }

        // If the layer is not editable, we can safely tween the text
        if (!metadata.textOptions) {
            if (!formattedKeyframes.text) {
                formattedKeyframes.text = [];
            }

            formattedKeyframes.text.push({
                s: [textContent],
                h: 1,
                t: textPropertyKeyframe.t,
            });
        }
    });

    // Add them to the timeline
    Object.keys(formattedKeyframes).forEach((property) => {
        applyTween([property], {
            k: formattedKeyframes[property]
        }, timeline);
    });

    return textContentToPrepare;
}

/**
 * A callback function for text object creation and renderer resizing.
 * Primarily scales up the resolution of the text so it doesn't appear blurry when scaled.
 * Must be called after other related parent and linked parent objects are created.
 *
 * @param      {PIXI.Text}  layerObject  The layer object
 * @returns {number} The maximum font size loaded that needs to be loaded for a text object
 */
export function getMaxFontSize(layerObject) {
    // Now focus on the changing scale of a text object to see how we can optimize its size based on how large it appears
    // Get an array of all objects that could affect the text object's scale
    const displayObjects = [layerObject];
    // Calculate our text resolution options are based on the scaling of the object and its parents/linked parents.
    const tweens = [
        ...layerObject.layerTimeline.getPropertyTweens('scale.x'),
        ...layerObject.layerTimeline.getPropertyTweens('scale.y'),
    ];
    // Loop through all of the linked parent layers
    layerObject.forEachLinkedParent((parent) => {
        tweens.push(
            ...parent.layerTimeline.getPropertyTweens('scale.x'),
            ...parent.layerTimeline.getPropertyTweens('scale.y'),
        );
        displayObjects.push(parent);
    });
    // Loop through all of the parent layers
    layerObject.forEachParent((parent) => {
        tweens.push(
            ...parent.layerTimeline.getPropertyTweens('scale.x'),
            ...parent.layerTimeline.getPropertyTweens('scale.y'),
        );
        displayObjects.push(parent);

        // And loop through that parent's Linked Parent
        parent.forEachLinkedParent((parentLinkedParent) => {
            tweens.push(
                ...parentLinkedParent.layerTimeline.getPropertyTweens('scale.x'),
                ...parentLinkedParent.layerTimeline.getPropertyTweens('scale.y'),
            );
            displayObjects.push(parentLinkedParent);
        });
    });

    const initialFontSize =
        layerObject.layerTimeline.getPropertyValueAtGlobalTime('style.fontSize', 0) || 1;
    // Get the base text resolution based on the first frame it's visible at
    const scaleMax = displayObjects.reduce(
        (accumulator, displayObject) => {
            const {
                layerTimeline
            } = displayObject;
            // The "|| .001" isn't explicitly required, as tween will likely cause a >0 resolution, but this is a safety check in case of weird construction
            const scaleX = layerTimeline.getPropertyValueAtGlobalTime('scale.x', 0) || 0.1;
            const scaleY = layerTimeline.getPropertyValueAtGlobalTime('scale.y', 0) || 0.1;

            accumulator.x *= scaleX;
            accumulator.y *= scaleY;

            return accumulator;
        },
        // Calculate the fontSize at that time
        {
            x: initialFontSize,
            y: initialFontSize,
        },
    );

    // Calculate the maximum value for scaleX/scaleY over the course of time by traversing every tween that touches this object
    tweens.forEach((tween) => {
        // Get the scale of the object at the start and end of this tween
        const {
            globalStartTime,
            globalEndTime
        } = tween;

        let startScaleX = 1;
        let startScaleY = 1;
        let endScaleX = 1;
        let endScaleY = 1;

        // Get the size of the layer's font at each of the times
        const fontSizeStart =
            layerObject.layerTimeline.getPropertyValueAtGlobalTime('style.fontSize', globalStartTime) ||
            0.1;
        const fontSizeEnd =
            layerObject.layerTimeline.getPropertyValueAtGlobalTime('style.fontSize', globalEndTime) ||
            0.1;

        // Check what each object's scale is at that time
        displayObjects.forEach((displayObject) => {
            const {
                layerTimeline
            } = displayObject;

            startScaleX *=
                Math.abs(layerTimeline.getPropertyValueAtGlobalTime('scale.x', globalStartTime)) || 0.1;
            startScaleY *=
                Math.abs(layerTimeline.getPropertyValueAtGlobalTime('scale.y', globalStartTime)) || 0.1;
            endScaleX *=
                Math.abs(layerTimeline.getPropertyValueAtGlobalTime('scale.x', globalEndTime)) || 0.1;
            endScaleY *=
                Math.abs(layerTimeline.getPropertyValueAtGlobalTime('scale.y', globalEndTime)) || 0.1;
        });

        // Check if we have a scale bigger than our running total
        scaleMax.x = Math.max(scaleMax.x, startScaleX * fontSizeStart, endScaleX * fontSizeEnd);
        scaleMax.y = Math.max(scaleMax.y, startScaleY * fontSizeStart, endScaleY * fontSizeEnd);
    });

    // The additional resizing factor is to account for if the layer can resize up additional amounts when changing
    const resizingFactor = _.get(
            layerObject,
            'style.resizingStrategyOptions.stepDirection', [],
        ).includes(TextStyle.STEP_AND_BREAK_WORDS_DIRECTIONS.up) ?
        1.1 :
        1;
    return Math.max(scaleMax.x, scaleMax.y) * resizingFactor;
}

/**
 * Creates a text layer
 *
 * @param {object} layerData Exported layer payload
 * @param {object[]} assets Possible assets data from the project manifest
 * @param {object} timeline  Greensock timeline
 * @param {object} options  Additional options that are passed on a change operation
 * @returns {PIXI.Text} A text layer object
 */
export async function createTextFromLayer(layerData, assets, timeline, options = {}) {
    // Specific layer properties can cause changes to asset urls
    // const layerContentProperties = getContentPropertiesFromLayerData(layerData);
    let asset;
    let resource;
    try {
        const assetLoad = await loadAssetForLayer(assets, layerData);
        ({
            asset,
            resource
        } = assetLoad);
    } catch (e) {
        console.error('Unable to load font asset', e);
    }
    let weight = 400;
    let isItalic = false;
    if (asset) {
        ({
            weight = 400,
            isItalic = false
        } = asset);
    } else {
        console.error(`Unable to load font asset for layer: ${_.get(layerData, 'meta.uuid')}`);
    }

    const {
        object
    } = options;
    if (object) {
        timeline.removeAllTweens();
        setDirty(object);
    }

    let font;
    if (resource && resource.sizes) {
        // Use the smallest font size for the initial load
        // TODO: Additional optimization would be to get the best size from the keyframes (before attempting to parse)
        font = resource.sizes[Object.keys(resource.sizes)[0]];
    }

    // Make sure the fallback font is installed at this size, too
    const fallbackFontVariantAsset = _.find(assets, {
        id: formatFontAssetId({
            weight,
            style: isItalic ? 'italic' : 'normal'
        }),
    });
    let fallbackFontVariantResource;
    if (fallbackFontVariantAsset) {
        try {
            fallbackFontVariantResource = await loadAsset(fallbackFontVariantAsset);
        } catch (e) {
            console.error(
                `Unable to load fallback font for ${weight} ${isItalic ? 'italic' : 'normal'}`,
                e,
            );
        }
    }

    // Font not available at that weight/style, load the default BitmapFont
    // Todo: only do this once? It's cached so it should be fine
    if (!fallbackFontVariantResource || !fallbackFontVariantResource.data) {
        try {
            await loadAsset(_.find(assets, {
                id: formatFontAssetId({})
            }));
        } catch (e) {
            console.error(`Unable to load default fallback`, e);
        }
    }

    // If the font isn't available, something else is very wrong
    if (!font) {
        try {
            const fallbackFontCollection = getFallbackFontCollection();
            font = await fallbackFontCollection.prepareFallbackFontAtIndex(0, 20);
        } catch (e) {
            throw Error(
                `Font not available for weight: ${weight} and style: ${isItalic ? 'italic' : 'normal'}`,
                e,
            );
        }
    }

    let text;
    if (object) {
        text = object;
        text.font = font;
    } else {
        text = new WMBitmapText(font);
    }

    const textDocumentKeyframes = _.get(layerData, 't.d.k', []);
    if (textDocumentKeyframes.length) {
        // Text layer Style and Content
        text.lifecycleTextContent = applyTextPropertiesToText(
            text,
            textDocumentKeyframes,
            timeline,
            layerData.meta,
        );
        applyTextStylePropertiesToText(text.style, textDocumentKeyframes, timeline, layerData.meta);
    }

    // Text "More Options" Features
    const BM_TO_ANCHOR_POINT_GROUPING = {
        1: WMBitmapText.AnchorPointGrouping.characters,
        2: WMBitmapText.AnchorPointGrouping.word,
        3: WMBitmapText.AnchorPointGrouping.line,
        4: WMBitmapText.AnchorPointGrouping.all,
    };

    const textOptionsData = _.get(layerData, 't.m', {});
    // Anchor Point Grouping
    if (textOptionsData.g) {
        text.anchorPointGrouping = BM_TO_ANCHOR_POINT_GROUPING[textOptionsData.g];
    }

    // Grouping Alignment
    if (textOptionsData.a) {
        const percentageTransformFunction = (value) => value * 0.01;
        const initialProperty = getInitialProperties(textOptionsData.a);
        applyProperty(
            text,
            'anchorPointGroupingAlignment',
            initialProperty,
            percentageTransformFunction,
        );

        // Animated?
        if (textOptionsData.a.a) {
            applyTween(
                ['anchorPointGroupingAlignment'],
                textOptionsData.a,
                text.timeline,
                percentageTransformFunction,
            );
        }
    }

    // TODO: Fill & Stroke, Inter-character blending

    const textAnimators = _.get(layerData, 't.a', []);
    textAnimators.forEach((textAnimatorData, index) => {
        createTextAnimatorFromData(text, textAnimatorData, index, timeline);
    });

    applyDisplayObjectProperties(text, layerData, timeline);

    // Prepare the given text at the expected font size (before other layer's may change it)
    await Promise.all(text.lifecycleTextContent.map((textContent) => text.prepareText(textContent)));

    // We're missing per-character text animations. These can be
    // created using the "Animate" button next to a text layer in
    // After Effects, and are distinguished from standard text
    // layer animations because they can operate on individual
    // characters using optional relative range start+end+offset
    // tweens. They are exported to layerData.t.a.
    //
    // If we choose to implement this functionality, we'll
    // theoretically be able to support dynamic text with
    // per-character animations (the range settings are all on
    // a relative scale of 0%-100%, which denotes animation
    // cursor position), but we'll have to split up text objects
    // into individual characters and manually position them.

    const loadCorrectFontSize = async () => {
        const maxFontSize = getMaxFontSize(text);

        let newFont;
        if (resource && resource.sizeLocations) {
            // TODO: Move this to bitmap fonts?
            const availableSizes = Object.keys(resource.sizeLocations);
            const bestSize =
                availableSizes.find((size) => Number(size) >= maxFontSize) ||
                availableSizes[availableSizes.length - 1];
            // Return the selected font size
            newFont = resource.sizes[bestSize];

            // If the font hasn't been loaded yet, load it
            if (!newFont) {
                const newFontSizeLocation = resource.sizeLocations[bestSize];
                const newFontResource = await loadUrl(newFontSizeLocation);
                newFont = newFontResource.font;
                // And make sure to cache it on the resource as well
                // TODO: Do this in the loader!
                resource.sizes[bestSize] = newFont;
            }
        } else {
            // If the font isn't available, something else is very wrong
            throw Error(
                `Font not available for weight: ${weight} and style: ${isItalic ? 'italic' : 'normal'}`,
            );
        }

        text.font = newFont;

        // Prepare all text again, now with the most correct font size.
        await Promise.all(
            text.lifecycleTextContent.map((textContent) => text.prepareText(textContent)),
        );

        // Force a text update with (respectDirty=false)
        text.updateText(false);
    };
    text[waymarkAuthorCustomProperties.postStageCreationSetup] = loadCorrectFontSize;
    text[waymarkAuthorCustomProperties.onRendererSetScale] = loadCorrectFontSize;
    text[waymarkTextCustomProperties.onTextContentChange] = loadCorrectFontSize;
    text[waymarkTextCustomProperties.onFontPropertyChange] = loadCorrectFontSize;
    text[waymarkTextCustomProperties.onFillColorChange] = loadCorrectFontSize;

    return text;
}
/* eslint-enable no-param-reassign, jsdoc/no-undefined-types */