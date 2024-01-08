// Vendor
import {
    Loader,
    LoaderPool
} from 'pixi.js';

// Local
import {
    getAssetUrl,
    findAndGetAssetUrl
} from '../../manifest/index.js';

// Mapping of this loading pulled from the Resource-Loader library
// https://github.com/englercj/resource-loader/blob/v3.0.1/src/Resource.js#L1049-L1058
const ASSET_TYPE_TO_LOAD_TYPE = {
    /** Uses XMLHttpRequest to load the resource. */
    xhr: 1,
    /** Uses an `Image` object to load the resource. */
    image: 2,
    /** Uses an `Audio` object to load the resource. */
    audio: 3,
    /** Uses a `Video` object to load the resource. */
    video: 4,
};

/**
 * Adds an single asset to the shared Loader
 *
 * @param {object} asset The asset
 * @param {Loader} loader The resource loader instance to add the asset to
 * @returns {object} The added asset's resource representation
 */
export const addAsset = async (asset, loader) => {
    let url;
    try {
        url = await getAssetUrl(asset);
    } catch (error) {
        // Don't let bad asset urls halt the asset and template loading process.
        // Throw a warning and move on.
        console.warn('Cannot load asset', asset, error);
        return null;
    }

    let usedLoader = loader;
    if (!usedLoader) {
        usedLoader = LoaderPool.getLoader();
    }

    const resource = loader.resources[url];

    // Don't add the url if it's already been added to the loader
    if (!resource) {
        // We have some assets that don't have a file extension so the resource loader doesn't know what to do
        // We'll do this to be explicit about loading in that case based on if our asset has an explicit type.
        if (Object.keys(ASSET_TYPE_TO_LOAD_TYPE).includes(asset.type)) {
            usedLoader.add({
                url,
                loadType: ASSET_TYPE_TO_LOAD_TYPE[asset.type],
                crossOrigin: true,
            });
        } else {
            usedLoader.add({
                url,
                crossOrigin: true,
            });
        }
    }

    return usedLoader.resources[url];
};

/**
 * Loads all queued assets.
 *
 * @param {Loader} loader The resource loader instance to add the asset to
 * @returns     {Promise} Promise that resolves on loading of all assets
 */
export const loadQueuedAssets = async (loader) => {
    let usedLoader = loader;
    if (!usedLoader) {
        usedLoader = LoaderPool.getLoader();
    }
    return new Promise((resolve) => {
        const errorCallbackId = usedLoader.onError.add((error, ldr, resource) => {
            // Asset loading should fail gracefully if they do not reference an loadable asset (ex. 404).
            // We still want to be able to setup and run a template, so note the loading error in the console
            // and move on.
            console.error(error, resource.url);
        });
        usedLoader.load(() => {
            usedLoader.onError.detach(errorCallbackId);
            resolve();
        });
    });
};

/**
 * Loads all assets passed, used when setting up the template the first time
 *
 * @param      {object[]}  [assets=[]]         The assets
 * @returns {Promise} Promise that resolves on loading of all assets
 */
export const loadAllAssets = async (assets = []) => {
    const loader = LoaderPool.getLoader();
    const gettingAssets = [];
    for (let i = 0; i < assets.length; i += 1) {
        const asset = assets[i];
        // Compositions have layers and aren't assets that need loading
        if (asset && !asset.layers) {
            gettingAssets.push(addAsset(asset, loader));
        }
    }

    await Promise.all(gettingAssets);
    return loadQueuedAssets(loader);
};

/**
 * Loads a single asset, helpful on layer setup
 *
 * @param      {object}  asset         The asset
 * @returns {Promise} Promise that resolves to the loaded resource
 */
export const loadAsset = async (asset) => {
    const loader = LoaderPool.getLoader();
    const resource = await addAsset(asset, loader);
    await loadQueuedAssets(loader);
    return resource;
};

/**
 * Loads or fetches a resource keyed on the URL passed
 *
 * @param {string} url The Url to loas
 * @returns {Promise} Promise that resolves to the resource
 */
export const loadUrl = async (url) =>
    new Promise((resolve, reject) => {
        const foundResource = Loader.cache[url];
        // We don't need to load the url if it's already been loaded once
        if (foundResource) {
            // If it's still being loaded, wait until it is done
            if (!foundResource.isComplete) {
                foundResource.onAfterMiddleware.once(resolve);
                if (foundResource.onError) {
                    foundResource.onError.once(reject);
                }
            } else {
                resolve(foundResource);
            }
            return;
        }

        const loader = LoaderPool.getLoader();
        loader.onError.once(reject);
        loader.add({
            url,
            crossOrigin: true,
        });
        // Add this to the cache here.
        // This is a workaround for a race condition when we have multiple calls to loadUrl in a Promise.all()
        // Resources are not added to the cache until the loader actually starts loading, so by adding it here we can prevent
        // multiple attempts to load the same resource before it has been added to the cache via load.
        if (!foundResource) {
            const found = loader.resources[url];
            Loader.cache[url] = found;
        }

        loader.load((thisLoader, resources) => {
            const resource = resources[url];
            resolve(resource);
        });
    });

/**
 * Load a specific asset for a layer from the project's assets
 *
 * @param      {object[]}          assets              The assets array from videoData
 * @param      {object}            layerData           The layer data
 * @param      {object}            layerModifications       Layer-specific modifications that can change the asset requested
 * @returns {Promise} Promise that resolves to an object of the loaded asset and resource
 */
export const loadAssetForLayer = async (assets, layerData, layerModifications) => {
    const {
        asset,
        url
    } = await findAndGetAssetUrl(assets, layerData, layerModifications);

    let resource;
    try {
        resource = await loadUrl(url);
    } catch (e) {
        console.error('Unable to load resource for asset:', asset, 'at url:', url, e);
    }

    return {
        asset,
        resource,
    };
};