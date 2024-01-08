/* eslint-disable import/prefer-default-export */
import _ from 'lodash';

import {
    getAccountCollectionSlugs
} from 'app/state/ducks/accounts/selectors.js';
import {
    getCollectionBySlug
} from 'app/state/ducks/collections/selectors.js';

/**
 * Returns whether the current account has permission to view a given variant group.
 * Note that this will return true while the variant group is still fetching, and if the collection is private, it will
 * return false while the user's account is still fetching even if they have permissions for it.
 * In order to avoid false negatives or false positives, make sure to take measures to wait until the user's account has loaded before making any final
 * decisions about redirecting the user or showing them private content.
 *
 * ie,
 *  if(!doesUserHavePermissionToViewVariantGroup) {
 *    if(hasFetchedAccount){
 *      // the account is fetched so we know for sure they don't have permissions
 *      // redirect the user away from this page now
 *    } else {
 *      // the account is still being fetched so we don't know if the user has permissions or not yet
 *      // just keep waiting but don't show private contents yet
 *    }
 *  }
 *
 * @param {object} state
 * @param {string} variantGroupSlug
 */
export const doesUserHavePermissionToViewVariantGroup = (state, variantGroupSlug) => {
    const variantGroup = getCollectionBySlug(state, variantGroupSlug);
    const isVariantGroupPublic = _.get(variantGroup, 'is_public', true);

    const accountCollectionSlugs = getAccountCollectionSlugs(state);

    return isVariantGroupPublic || accountCollectionSlugs.includes(variantGroupSlug);
};