// Vendor
import _ from 'lodash';

// Local
import {
    getVariantBySlugAndBusiness,
    isFetchingVariant,
} from 'app/state/ducks/variants/selectors.js';

/**
 * From the list of provided variant slugs, determines which variants
 * have not yet been fetched from the server and loaded into the store state.
 * @param  {Object} state           Current store state
 * @param  {Array} variantSlugs     Compound variant slugs
 * @param  {String} [businessGUID]
 * @return {Array}  Array of variant slugs that need to be fetched from the server.
 */
export const excludeLoadedVariantsForBusiness = (state, variantSlugs, businessGUID = null) => {
    if (!variantSlugs) {
        return [];
    }

    // TODO: Fetch status for all variant testing needs to take business into account.
    return variantSlugs.filter(
        (slug) =>
        !(getVariantBySlugAndBusiness(state, slug, businessGUID) || isFetchingVariant(state, slug)),
    );
};

/**
 * Returns the list of variants whose slug is in the provided list of slugs.
 * @param  {Object} state
 * @param  {Array} slugs
 * @param  {String} [businessGUID]
 * @return {Array} List of variants
 */
export const getVariantsFromSlugsForBusiness = (state, slugs, businessGUID = null) =>
    state.variants.items.filter(
        (variant) => variant.selected_business === businessGUID && _.includes(slugs, variant.slug),
    );