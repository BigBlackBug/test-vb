// Local
import {
    getAccountGroupVideoAssetLibrarySlugs
} from 'app/state/ducks/accounts/selectors.js';
import {
    getEditorVideoAssetLibrarySlugs
} from 'app/state/ducks/shop/selectors.js';

/**
 * Retruns an array of all available VideoAssetLibrary slugs.
 * @param  {object}     state
 * @return {array}      Array of VideoAssetLibrary slugs.
 */
// eslint-disable-next-line import/prefer-default-export
export const getVideoAssetLibrarySlugs = (state) => {
    const accountGroupVideoAssetLibrarySlugs = getAccountGroupVideoAssetLibrarySlugs(state);
    const editorVideoAssetLibrarySlugs = getEditorVideoAssetLibrarySlugs(state);

    return [...accountGroupVideoAssetLibrarySlugs, ...editorVideoAssetLibrarySlugs];
};