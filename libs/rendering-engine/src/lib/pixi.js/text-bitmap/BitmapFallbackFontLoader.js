// eslint-disable jsdoc/*
// eslint-disable-next-line import/no-extraneous-dependencies
import _ from 'lodash';
import {
    autoDetectFormat,
    WaymarkFallbackFontFormat
} from './formats/index.js';

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapFallbackFontLoader(pixiNamespace) {
    /**
     * {@link PIXI.Loader Loader} middleware for loading
     * bitmap-based fonts suitable for using with {@link PIXI.WMBitmapText}.
     *
     * @class
     * @memberof PIXI
     * @implements {pixiNamespace.ILoaderPlugin}
     */
    // eslint-disable-next-line import/prefer-default-export
    class BitmapFallbackFontLoader {
        /**
         * Called after a resource is loaded.
         *
         * @see PIXI.Loader.loaderMiddleware
         * @param {pixiNamespace.LoaderResource} resource The resource to load
         * @param {Function} next Callback function for loading the next resource
         */
        static use(resource, next) {
            const format = autoDetectFormat(resource.data);

            // Resource was not recognised as any of the expected font data format
            if (!format || format !== WaymarkFallbackFontFormat) {
                next();
                return;
            }

            const {
                weight = 400,
                    isItalic = false,
                    fallbackFonts,
                    charactersRanges,
                    ligatures,
            } = format.parse(resource.data);
            const fallbackFontCollection = new pixiNamespace.BitmapFallbackFontCollection(
                fallbackFonts,
                charactersRanges,
                ligatures,
            );
            // eslint-disable-next-line no-param-reassign
            _.set(
                pixiNamespace.FallbackFontCollections,
                `['${weight}'][${isItalic ? 'italic' : 'normal'}]`,
                fallbackFontCollection,
            );
            next();
        }
    }

    // eslint-disable-next-line no-param-reassign
    pixiNamespace.BitmapFallbackFontLoader = BitmapFallbackFontLoader;
    pixiNamespace.Loader.registerPlugin(BitmapFallbackFontLoader);
}
// eslint-enable jsdoc