// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';
import {
    addBusinessToURL
} from './utils.js';

/**
 * Fetch a single variant for the store.
 *
 * @param  {String} slug          Compound variant slug.
 * @param  {String} businessGUID  Selected business guid.
 */
export const fetchVariant = (slug, businessGUID) => {
    const url = `video-template-variants/${slug}/`;

    return baseAPI.get(addBusinessToURL(url, businessGUID));
};

/**
 * Fetch a single variant by its GUID
 *
 * @param {string} variantGUID  GUID of the variant to load
 * @param  {String} businessGUID  Selected business guid
 */
export const fetchVariantByGUID = (variantGUID, businessGUID) => {
    const url = `video-template-variants/${variantGUID}/`;

    return baseAPI.get(addBusinessToURL(url, businessGUID));
};

/**
 * Fetch the variants corresponding with the slugs provided.
 * @param  {Array} variantSlugs    Compound variant slugs.
 * @param  {Array} businessGUID    Selected business guid.
 * @param  {Bool}  isCompoundSlugs If the slugs are compound: video_template.video_template_varaint
 */
export const fetchVariantsList = ({
    variantSlugs,
    compoundSlugs,
    businessGUID
}) => {
    let url = addBusinessToURL('video-template-variants/', businessGUID);

    if (variantSlugs) {
        url = addQueryParametersToURL(url, {
            slugs: variantSlugs.join(','),
        });
    } else if (compoundSlugs) {
        url = addQueryParametersToURL(url, {
            variant_slugs: compoundSlugs.join(','),
        });
    }

    return baseAPI.get(url);
};