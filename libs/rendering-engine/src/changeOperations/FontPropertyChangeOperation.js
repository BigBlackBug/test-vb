// Vendor
import _ from 'lodash';

// Local
import {
    createTextFromLayer,
    waymarkTextCustomProperties
} from '../layers/text/index.js';
import {
    findLayerData,
    assetTypes,
    bitmapFontAssetParsingPlugin,
    formatFontAssetId,
    updateAssetData,
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

const KEYFRAME_DOTPATHS = {
    fontSize: 's.s',
    fontFamily: 's.f',
    lineHeight: 's.lh'
};

/**
 * FONT_PROPERTY change operation. Handles modifying font related properties for a given
 * text layer. Valid font properties include: `fontFamily`, `fontWeight`, `fontStyle`, and
 * `fontSizeAdjustment`.
 *
 * Example of valid font family change payload:
 * ```
 *  {
 *    layer: '5b6ca0e7-3739-413e-978a-9a1b115795a6',
 *    fontFamily: 'Roboto',
 *    fontWeight: '300',
 *    fontStyle: 'italic',
 *    fontSizeAdjustment: 0.1,
 *    webfontloaderConfiguration: {
 *      google: {
 *        families: ['Roboto:300italic'],
 *      },
 *    },
 *  }
 * ```
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {string} payload.fontFamily  The font family ex: 'Roboto'
 * @param {string} payload.fontWeight The weight or boldness of type ex: '300'
 * @param {string} payload.fontStyle  The font style. One of ['normal', 'italic', 'oblique]
 * @param {number} payload.fontSizeAdjustment  The amount to change the size of the font relative to its default ex: 0.1
 * @param {number} payload.fontSize
 * @param {number} payload.lineHeight
 * @param {string} payload.resizingStrategy?
 * @param {object} payload.webfontloaderConfiguration A configuration to pass to webfontloader that maps to a particular font
 *
 * @memberof ChangeOperations
 * @public
 */
export default class FontPropertyChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
        this.originalLayerFontValues = this.getOriginalLayerValues();
    }

    static get type() {
        return 'FONT_PROPERTY';
    }

    static get isLayerModification() {
        return true;
    }

    /**
     * Reads the relevant values from the original project manifest.
     *
     * @returns {object} Font size and family object for a layer
     * @private
     */
    getOriginalLayerValues = () => {
        const originalLayerData = findLayerData(this.renderer.originalVideoData, this.payload.layer);
        const originalLayerKeyframes = originalLayerData.t.d.k;

        const values = {};
        for (let i = 0; i < originalLayerKeyframes.length; i += 1) {
            const keyframe = originalLayerKeyframes[i];
            if (_.get(keyframe, KEYFRAME_DOTPATHS.fontFamily)) {
                values.fontSize = _.get(keyframe, KEYFRAME_DOTPATHS.fontSize);
                values.fontFamily = _.get(keyframe, KEYFRAME_DOTPATHS.fontFamily);
                break;
            }
        }

        return values;
    };

    updateManifest = async () => {
        // If we have a font change, ensure the font is loaded.
        const {
            fontVariantUUID,
            lineHeight,
            fontSizeAdjustment,
            fontSize,
            fontWeight,
            fontStyle,
            resizingStrategy
        } = this.payload;
        let {
            fontFamily
        } = this.payload;

        let fontId;
        if (fontFamily) {
            fontId = formatFontAssetId({
                family: fontFamily,
                weight: fontWeight,
                style: fontStyle,
            });

            // Create a new asset to load
            const newAsset = {
                id: fontId,
                type: assetTypes.bitmapFont,
                isItalic: fontStyle === 'italic',
                weight: fontWeight,
                location: {
                    plugin: bitmapFontAssetParsingPlugin.name,
                },
            };

            if (fontVariantUUID) {
                newAsset.location.id = fontVariantUUID;
            } else {
                newAsset.location.legacyId = fontFamily;
            }

            this.newAsset = updateAssetData(this.renderer.videoData.assets, newAsset, true);
            this.layerData.refId = this.newAsset.id;
        }

        let newFontSize;
        // Font size adjustment change
        if (fontSizeAdjustment) {
            newFontSize =
                this.originalLayerFontValues.fontSize +
                parseInt(fontSizeAdjustment * this.originalLayerFontValues.fontSize, 10);
        }

        // Font size change
        if (fontSize) {
            newFontSize = parseInt(fontSize, 10);
        }

        const textPropertyKeyframes = this.layerData.t.d.k;

        if (resizingStrategy) {
            _.set(this.layerData, 'meta.textOptions.resizingStrategy', resizingStrategy);
        }

        textPropertyKeyframes.forEach((textPropertyKeyframe) => {
            if (
                _.isObject(textPropertyKeyframe) &&
                textPropertyKeyframe.s &&
                typeof textPropertyKeyframe.s.f !== 'undefined'
            ) {
                if (fontId) {
                    _.set(textPropertyKeyframe, KEYFRAME_DOTPATHS.fontFamily, fontId);
                }
                if (newFontSize) {
                    _.set(textPropertyKeyframe, KEYFRAME_DOTPATHS.fontSize, newFontSize);
                }
                if (lineHeight) {
                    _.set(textPropertyKeyframe, KEYFRAME_DOTPATHS.lineHeight, lineHeight);
                }
            }
        });
    };

    getAssetsToLoad = () => [this.newAsset];

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        await Promise.all(
            layers.map(async (layer) => {
                await createTextFromLayer(
                    this.layerData,
                    this.renderer.videoData.assets,
                    layer.layerTimeline, {
                        object: layer,
                    },
                );

                await layer[waymarkTextCustomProperties.onFontPropertyChange].call();
            }),
        );
    };
}