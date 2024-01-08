// eslint-disable-next-line import/no-extraneous-dependencies
import {
    autoDetectFormat,
    WaymarkFormat
} from './formats/index.js';

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapFontLoader(pixiNamespace) {
    /**
     * {@link pixiNamespace.Loader Loader} middleware for loading
     * bitmap-based fonts suitable for using with {@link pixiNamespace.WMBitmapText}.
     *
     * @class
     * @memberof pixiNamespace
     * @implements {pixiNamespace.ILoaderPlugin}
     */
    // eslint-disable-next-line import/prefer-default-export
    class BitmapFontLoader {
        /**
         * Called after a resource is loaded.
         *
         * @see pixiNamespace.Loader.loaderMiddleware
         * @param {pixiNamespace.LoaderResource} resource the current resouce being inspected
         * @param {Function} next function to continue loading operation
         */
        static use(resource, next) {
            const format = autoDetectFormat(resource.data);

            if (format === WaymarkFormat) {
                const fontData = format.parse(resource.data);

                // Install the font without textures (we only load textures when needed)
                const font = pixiNamespace.WMBitmapFont.install(fontData, []);
                // eslint-disable-next-line no-param-reassign
                resource.font = font;
            }

            next();
        }
    }

    // eslint-disable-next-line no-param-reassign
    pixiNamespace.WMBitmapFontLoader = BitmapFontLoader;
    pixiNamespace.Loader.registerPlugin(BitmapFontLoader);
}