// eslint-disable-next-line import/no-extraneous-dependencies
import {
    autoDetectFormat,
    WaymarkFontVariantFormat
} from './formats/index.js';
import settings from '../../../settings.js';
import {
    loadUrl,
} from '../../../layers/utils/index.js';

// Key `{variantUuid}:{size}`
// Value Promise<Resource>
const cachedSizeResources = {};

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapFontVariantLoader(pixiNamespace) {
    /**
     * {@link pixiNamespace.Loader Loader} middleware for loading
     * bitmap-based fonts suitable for using with {@link pixiNamespace.WMBitmapText}.
     *
     * @class
     * @memberof PIXI
     * @implements {pixiNamespace.ILoaderPlugin}
     */
    // eslint-disable-next-line import/prefer-default-export
    class BitmapFontVariantLoader {
        /**
         * Called after a resource is loaded.
         *
         * @see pixiNamespace.Loader.loaderMiddleware
         * @param {pixiNamespace.LoaderResource} resource The resource to load
         * @param {Function} next Callback function for loading the next resource
         */
        static async use(resource, next) {
            const format = autoDetectFormat(resource.data);

            if (format === WaymarkFontVariantFormat) {
                const fontVariant = format.parse(resource.data);

                if (!resource.sizeLocations) {
                    // eslint-disable-next-line no-param-reassign
                    resource.sizeLocations = {};
                }
                if (!resource.sizes) {
                    // eslint-disable-next-line no-param-reassign
                    resource.sizes = {};
                }

                Object.keys(fontVariant.sizes).forEach((fontSize) => {
                    const fontLocation = fontVariant.sizes[fontSize];
                    const url = `${settings.WAYMARK_BFS_S3}/${fontLocation}`;
                    // eslint-disable-next-line no-param-reassign
                    resource.sizeLocations[fontSize] = url;
                });

                // Load the smallest size so we have something
                // Use the smallest font size for the initial load
                // TODO: Additional optimization would be to get the best size from the keyframes
                const smallestFontSize = Object.keys(resource.sizeLocations)[0];
                const cacheKey = `${fontVariant.uuid}:${smallestFontSize}`;

                if (!cachedSizeResources[cacheKey]) {
                    cachedSizeResources[cacheKey] = loadUrl(resource.sizeLocations[smallestFontSize]);
                }

                const smallestFontSizeResource = await cachedSizeResources[cacheKey];
                // eslint-disable-next-line no-param-reassign
                resource.sizes[smallestFontSize] = smallestFontSizeResource.font;
            }

            next();
        }
    }

    // eslint-disable-next-line no-param-reassign
    pixiNamespace.BitmapFontVariantLoader = BitmapFontVariantLoader;
    pixiNamespace.Loader.registerPlugin(BitmapFontVariantLoader);
}