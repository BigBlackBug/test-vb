/**
 * NOTE: I admit that in isolation, this `stateKey` mapping looks pretty pointless.
 * To help explain its purpose: this is a mapping of duck module names (the top-level
 * duck directory names) to dotstring path to the relevant local state slice for that
 * duck. It just so happens that right now, our ducks map 1-to-1 with top-level,
 * same-named keys in the global state. But important to note that is a (common,
 * but not-strictly-necessary) coincidence.
 */
/* eslint-disable-next-line import/prefer-default-export */
export const stateKeys = {
    accounts: 'accounts',
    businessSearch: 'businessSearch',
    checkout: 'checkout',
    collections: 'collections',
    configuredVideos: 'configuredVideos',
    editor: 'editor',
    loginActions: 'loginActions',
    offers: 'offers',
    purchase: 'purchase',
    purchasedVideoProducts: 'purchasedVideoProducts',
    receipts: 'receipts',
    savedDrafts: 'savedDrafts',
    searchResultGroups: 'searchResultGroups',
    shop: 'shop',
    unsplashImages: 'unsplashImages',
    userVideos: 'userVideos',
    variants: 'variants',
};