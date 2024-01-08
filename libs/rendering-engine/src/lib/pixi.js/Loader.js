/* eslint-disable no-param-reassign, func-names, no-underscore-dangle */

import {
    Loader
} from 'pixi.js';

/**
 * Enables changes to the asset loader
 *
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableLoaderProperties(pixiNamespace) {
    // a simple in-memory cache for resources, now made accessible
    pixiNamespace.Loader.cache = {};

    /**
     * A simple in-memory cache for resource.
     * Modified from https://github.com/englercj/resource-loader/blob/release/3.x/src/middleware/caching.js
     *
     * @memberof middleware
     * @function caching
     * @example
     * import { Loader, middleware } from 'resource-loader';
     * const loader = new Loader();
     * loader.use(middleware.caching);
     * @param {pixiNamespace.Resource} resource - Current Resource
     * @param {Function} next - Callback when complete
     */
    const loaderCaching = function(resource, next) {
        // if cached, then set data and complete the resource
        if (pixiNamespace.Loader.cache[resource.url]) {
            const cachedResource = pixiNamespace.Loader.cache[resource.url];

            if (cachedResource.data) {
                resource.data = cachedResource.data;
                resource.complete(); // marks resource load complete and stops processing before middlewares
            } else if (cachedResource.error) {
                resource.error = cachedResource.error;
                resource.complete(); // marks resource load complete and stops processing before middlewares
            } else {
                // If the resource is still loading, wait for it to finish
                cachedResource.onComplete.once((loadedResource) => {
                    resource.data = loadedResource.data;
                    if (!resource.isComplete) {
                        resource.complete(); // marks resource load complete and stops processing before middlewares
                    }
                });
            }
            // if not cached, Add this resource to the cache
        } else {
            pixiNamespace.Loader.cache[resource.url] = resource;
        }

        next();
    };

    pixiNamespace.Loader.registerPlugin({
        pre: loaderCaching
    });

    class LoaderPool {
        constructor() {
            this.loaders = [];
        }

        getLoader() {
            let loader = this.loaders.find(({
                loading
            }) => !loading);
            if (loader) {
                return loader;
            }

            loader = new Loader();
            loader.onComplete.add((loaderUsed) => {
                loaderUsed.reset();
            });
            this.loaders.push(loader);
            return loader;
        }
    }

    const loaderPoolSingleton = new LoaderPool();
    pixiNamespace.LoaderPool = loaderPoolSingleton;
    window.LoaderPool = loaderPoolSingleton;

    /**
     * Loads this resources using an element that has a single source,
     * like an HTMLImageElement.
     *
     * This is identical to the existing _loadElement method, with the addition of the 'preload' section
     *
     * @private
     * @param {string} type - The type of element to use.
     */
    pixiNamespace.LoaderResource.prototype._loadElement = function(type) {
        if (this.metadata.loadElement) {
            this.data = this.metadata.loadElement;
        } else if (type === 'image' && typeof window.Image !== 'undefined') {
            this.data = new Image();
        } else {
            this.data = document.createElement(type);
        }

        if (this.crossOrigin) {
            this.data.crossOrigin = this.crossOrigin;
        }

        // Dues to a bug in recent versions of Firefox, the `canplaythrough` event is never
        // reached for some videos and our onComplete event is never fired unless we set preload to true
        // https://github.com/englercj/resource-loader/issues/150
        // TODO: Add this as part of the VideoLoadStrategy and AudioLoadStrategy when the resource loader is upgraded to v4
        if (['audio', 'video'].includes(type)) {
            this.data.setAttribute('preload', 'auto');
        }

        if (!this.metadata.skipSource) {
            this.data.src = this.url;
        }

        this.data.addEventListener('error', this._boundOnError, false);
        this.data.addEventListener('load', this._boundComplete, false);
        this.data.addEventListener('progress', this._boundOnProgress, false);

        if (this.timeout) {
            this._elementTimer = setTimeout(this._boundOnTimeout, this.timeout);
        }
    };

    // _loadSourceElement contains logic to load multiple sources for each media element
    // which we a) don't need b) causes loading errors to get swallowed if not attached to the given source element
    // so we're just overwriting it to use the default _loadElement which works as intended.
    pixiNamespace.LoaderResource.prototype._loadSourceElement = function(type) {
        pixiNamespace.LoaderResource.prototype._loadElement.call(this, type);
        this.data.addEventListener('canplaythrough', this._boundComplete, false);
        this.data.load();

        if (this.timeout) {
            this._elementTimer = setTimeout(this._boundOnTimeout, this.timeout);
        }
    };
}