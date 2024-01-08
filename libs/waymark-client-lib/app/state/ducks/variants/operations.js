// Local
import _ from 'lodash';
import WaymarkAuthorBundleManager from 'shared/web_video/utils/WaymarkAuthorBundleManager.js';
import {
    PromiseCache
} from 'app/objects.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchVariant,
    fetchVariantByGUID,
    fetchVariantsList
} from 'shared/api/index.js';
import actions from './actions.js';

// We cache the promise returned by the `fetchVariant` API call here, which
// we'll use to ensure that while a request for the same variant slug, slugs, or guid is already
// outstanding, we can return the appropriate promise for that variant or item view request.
const pendingVariantRequests = new PromiseCache();

/**
 * Ensures that the variant with the corresponding slug
 * is loaded into the store state.
 * @param {string}  slug Variant slug.
 * @param {string|null}  [businessGUID]  Optional GUID for a business to personalize the variant's configuration for
 * @return {Promise}
 */
const loadVariant =
    (slug, businessGUID = null) =>
    async (dispatch, getState) => {
        const storeState = getState();

        // Make sure we remove the variant part of the slug - only want the template!
        const templateSlug = slug.replace(/\..*/, '');
        // Start loading the bundle files for this template if it's a Waymark Author Template
        if (WaymarkAuthorBundleManager.isWaymarkAuthorTemplate(templateSlug)) {
            // Wait for the bundle to finish so we can make sure it loads correctly
            await WaymarkAuthorBundleManager.loadBundle(templateSlug);
        }

        const foundVariant = selectors.getVariantBySlugAndBusiness(storeState, slug, businessGUID);

        if (foundVariant) {
            // Don't fetch if we already have this variant!
            return foundVariant;
        }

        if (!selectors.isFetchingVariant(storeState, slug)) {
            // If we need to fetch this variant, let's get to it!
            // TODO: isFetchingVariant needs to take business into account.
            dispatch(actions.fetchingVariant(slug));

            try {
                const fetchingVariant = fetchVariant(slug, businessGUID);
                // Store the promise in the cache in case we need it later.
                pendingVariantRequests.set(slug, fetchingVariant);
                const variant = await fetchingVariant;

                // The request completed, so let's null out the cache.
                pendingVariantRequests.clear(slug);
                dispatch(actions.receivedVariant(variant));
                return variant;
            } catch (error) {
                // The request completed (failed), so let's null out the cache.
                pendingVariantRequests.clear(slug);
                dispatch(actions.failedVariantFetch(error, slug));
                return error;
            }
            // If we don't have the variant loaded, but also don't need to fetch,
            // we should have a cached promise that will return when the variant
            // is received from the server.
        } else if (pendingVariantRequests.get(slug)) {
            return pendingVariantRequests.get(slug);
        }

        console.error(`Error loading variant with slug ${slug}.`);
        return null;
    };

/**
 * Ensure the variant with the given GUID is loaded into the store
 *
 * @param {string} variantGUID
 * @param {string}  [businessGUID]  Optional GUID for a business to personalize the variant's configuration for
 */
const loadVariantByGUID =
    (variantGUID, businessGUID = null) =>
    async (dispatch, getState) => {
        const storeState = getState();

        const foundVariant = selectors.getVariantByGUIDAndBusiness(
            storeState,
            variantGUID,
            businessGUID,
        );

        // Don't fetch if we already have this variant!
        if (foundVariant) return foundVariant;

        if (!selectors.isFetchingVariant(storeState, variantGUID)) {
            // If we need to fetch this variant, let's get to it!
            dispatch(actions.fetchingVariant(variantGUID));

            try {
                const fetchingVariant = fetchVariantByGUID(variantGUID, businessGUID);
                // Store the promise in the cache in case we need it later.
                pendingVariantRequests.set(variantGUID, fetchingVariant);
                const variant = await fetchingVariant;

                // The request completed, so let's null out the cache.
                pendingVariantRequests.clear(variantGUID);
                dispatch(actions.receivedVariant(variant));
                return variant;
            } catch (error) {
                // The request completed (failed), so let's null out the cache.
                pendingVariantRequests.clear(variantGUID);
                dispatch(actions.failedVariantFetch(error, variantGUID));
                return error;
            }
        }

        // If we don't have the variant loaded, but also don't need to fetch,
        // we should have a cached promise that will return when the variant
        // is received from the server.
        if (pendingVariantRequests.get(variantGUID)) return pendingVariantRequests.get(variantGUID);

        console.error(`Error loading variant with GUID ${fetchVariantByGUID}.`);
        return null;
    };

/**
 * Fetch the necessary variants from the provided list of slugs and load
 * them into the store.
 * @param {String[]}  slugs
 * @param {string}    [businessGUID]  Optional GUID for a business to personalize the variants' configurations for
 * @return {Promise}
 */
const loadVariantsList =
    (slugs, businessGUID = null) =>
    async (dispatch, getState) => {
        // FIXME: This operation doesn't properly account for business GUID when checking
        //        to see if a variant is currently being loaded.

        const storeState = getState();

        const uniqueSlugs = _.uniq(slugs);

        // Filter out slugs for variants that we already have loaded.
        const variantSlugsToFetch = selectors.excludeLoadedVariantsForBusiness(
            storeState,
            uniqueSlugs,
            businessGUID,
        );
        if (!variantSlugsToFetch.length) {
            const loadedVariants = selectors.getVariantsFromSlugsForBusiness(
                getState(),
                uniqueSlugs,
                businessGUID,
            );
            // If we have all the variants we need, we're done! Return the variants:
            if (loadedVariants.length === uniqueSlugs.length) {
                return loadedVariants;
            }

            // Otherwise, let's return the a promise that will resolve when all the relevant
            // in-progress requests are completed.
            const cachedPromises = uniqueSlugs.reduce((accumulator, slug) => {
                if (pendingVariantRequests.get(slug)) {
                    accumulator.push(pendingVariantRequests.get(slug));
                }
                return accumulator;
            }, []);
            return Promise.all(cachedPromises);
        }

        // If we need to fetch some variants, let's get to it!
        dispatch(actions.fetchingVariant(variantSlugsToFetch));
        try {
            const fetchingVariants = fetchVariantsList({
                variantSlugs: variantSlugsToFetch,
                businessGUID,
            });
            // Store the promise in the cache in case we need it later.
            variantSlugsToFetch.forEach((slug) => pendingVariantRequests.set(slug, fetchingVariants));
            const variants = await fetchingVariants;

            // The request completed, so let's null out the cache.
            variantSlugsToFetch.forEach((slug) => pendingVariantRequests.clear(slug));
            dispatch(actions.receivedVariant(variants));
            return variants;
        } catch (error) {
            // The request completed (failed), so let's null out the cache.
            variantSlugsToFetch.forEach((slug) => pendingVariantRequests.clear(slug));
            dispatch(actions.failedVariantFetch(error, variantSlugsToFetch));
            return error;
        }
    };

export default {
    loadVariant,
    loadVariantByGUID,
    loadVariantsList,
};