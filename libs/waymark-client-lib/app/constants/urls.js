export const appRoot = '/';
const videosRoot = `${appRoot}videos/`;
const accountRoot = `${appRoot}account/`;
const shopRoot = `${appRoot}shop/`;
const portalRoot = `${appRoot}administration/`;

// Maps all route names to paths formatted for react-router
export const appRoutePaths = {
    /* Root */
    login: `${appRoot}login`,
    resetPassword: `${appRoot}reset-password`,
    // We still have a legacy funnel at /signup so we need to use /signups
    // until we retire it
    signup: `${appRoot}signups`,
    templateBrowser: `${appRoot}templates`,
    ai: `${appRoot}ai`,

    /* SDK */
    sdkLandingPage: `${appRoot}sdk`,

    /* Videos */
    // Old collection view paths which should now be redirected to the template browser with the
    // provided collection slug pre-selected
    oldCollectionView: `${videosRoot}collections/:collectionSlug`,
    editVariant: `${videosRoot}:variantSlug/edit`,

    /* Shop */
    // Redirects to homepage
    shop: shopRoot,
    checkout: `${shopRoot}checkout/:userVideoGUID`,
    offerCheckout: `${shopRoot}offer-checkout`,
    offerCheckoutSuccess: `${shopRoot}offer-checkout/success/:receiptGUID`,
    subscriptionCheckout: `${shopRoot}subscription-checkout`,
    subscriptionCheckoutSuccess: `${shopRoot}subscription-checkout/success/:receiptGUID`,

    checkoutCoupon: `${shopRoot}offer-checkout/?product=video_download_credits_01`,

    /* Account */
    accountVideos: accountRoot,
    accountSettings: `${accountRoot}settings`,
    editYourVideo: `${accountRoot}your-videos/:userVideoGUID/edit`,
    manageClientAccounts: `${accountRoot}managed-accounts`,

    /* Customer Admin Portal */
    manageUsers: portalRoot,
    billingSummary: `${portalRoot}billing-summary`,
};

/**
 * Maps all route names to either a static string pathname or a function which will dynamically construct
 * URLs if they include things like slugs or guids
 *
 * These URLs can be used with <InternalLink> components.
 */
export const appURLs = {
    /* Root */
    login: appRoutePaths.login,
    resetPassword: appRoutePaths.resetPassword,
    signup: appRoutePaths.signup,
    templateBrowser: appRoutePaths.templateBrowser,
    ai: appRoutePaths.ai,

    /* SDK */
    sdkLandingPage: appRoutePaths.sdkLandingPage,

    /* Videos */
    collectionView: (collectionSlug) => `${videosRoot}collections/${collectionSlug}`,
    editVariant: (variantSlug, variantGroupSlug) =>
        `${videosRoot}${variantSlug}/edit${
      variantGroupSlug ? `?variantGroup=${variantGroupSlug}` : ''
    }`,

    /* Shop */
    shop: appRoutePaths.shop,
    checkout: (userVideoGUID) => `${shopRoot}checkout/${userVideoGUID}`,
    offerCheckout: (productSlug) => `${shopRoot}offer-checkout?product=${productSlug}`,
    offerCheckoutSuccess: (receiptGUID) => `${shopRoot}offer-checkout/success/${receiptGUID}`,
    subscriptionCheckout: appRoutePaths.subscriptionCheckout,
    subscriptionCheckoutSuccess: (receiptGUID) =>
        `${shopRoot}subscription-checkout/success/${receiptGUID}`,

    checkoutCoupon: appRoutePaths.checkoutCoupon,

    /* Account */
    accountVideos: appRoutePaths.accountVideos,
    accountSettings: appRoutePaths.accountSettings,
    editYourVideo: (userVideoGUID) => `${accountRoot}your-videos/${userVideoGUID}/edit`,
    manageClientAccounts: appRoutePaths.manageClientAccounts,

    /* Customer Admin Portal */
    manageUsers: appRoutePaths.manageUsers,
    billingSummary: appRoutePaths.billingSummary,
};

// URLs of paths that will proxy to a CMS page and should therefore not be navigated to
// via react-router
export const cmsURLs = {
    home: appRoot,
    advertising: `${appRoot}advertising`,
    partners: `${appRoot}partners`,
    pricing: `${appRoot}marketing/pricing`,
    terms: `${appRoot}marketing/terms-of-service`,
    privacy: `${appRoot}marketing/privacy-policy`,
    enterprise: `${appRoot}marketing/enterprise`,
};

// URLs for waymark things that are hosted externally
export const externalURLs = {
    blog: 'https://blog.waymark.com',
    facebook: 'http://facebook.com/waymark/',
    hubspotIntake: 'https://share.hsforms.com/1-wyUKUcrRpKEjjYCTwnlpAc1vis',
    instagram: 'https://www.instagram.com/waymark/',
    twitter: 'https://twitter.com/waymark',
    linkedIn: 'https://www.linkedin.com/company/waymarkmarketing/',
    youtube: 'https://www.youtube.com/channel/UCjnosVrBnPzkKCvLim3MNwQ',
    help: 'https://help.waymark.com/',
    feedback: 'https://waymark.featureupvote.com/',
    careers: 'https://waymark.pinpointhq.com/',
    typeform: 'https://waymark.typeform.com/to/dWKNKe',
    // Not technically an external url per se, but one that we want to always perform a hard load on - it will redirect
    // users to the best collection for them
    templates: `${appRoot}templates`,
};

// Query params that are commonly used in URLs in the app
export const queryParams = {
    accountGroup: 'account_group',
    adminOverrideAccountGUID: 'admin_override_account_guid',
    templateBrowserFilters: {
        collection: 'collection',
        sort: 'sort',
        format: 'format',
        length: 'length',
        assets: 'assets',
    },
    coupon: 'coupon',
    sdkShouldCloseOnEditorExit: 'sdk_close_on_editor_exit',
    sdkMode: 'mode',
    sdkPartnerID: 'partnerid',
};

// Query params that we should allow to persist between pages if present
export const persistentQueryParams = [
    queryParams.adminOverrideAccountGUID,
    queryParams.coupon,
    queryParams.sdkMode,
    queryParams.sdkPartnerID,
];