import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};

/**
 * Get the coupon loaded into state.
 * @param   {object}    state
 */
localSelectors.getActiveCoupon = (state) => state.coupon;

/**
 * Get the guid of the coupon loaded into state.
 * @param {object}  state
 */
localSelectors.getActiveCouponGUID = (state) => {
    const activeCoupon = localSelectors.getActiveCoupon(state);

    return activeCoupon ? activeCoupon.guid : null;
};

/**
 * Returns whether the currently loaded coupon requires the user provide a credit card for purchase
 * @param   {object}  state
 * @return  {bool}    Whether the currently active coupon requires a credit card for purchase
 *                      If there is no active coupon, this will default to true
 */
localSelectors.isCreditCardRequiredForActiveCoupon = (state) =>
    state.coupon ? state.coupon.should_require_credit_card_for_purchase : true;

/**
 * Get the code for the referral coupon.
 * @param   {object}    state
 */
localSelectors.getReferralCouponCode = (state) => state.referralCouponCode;

/**
 * Get the guid for the referral coupon.
 * @param   {object}    state
 */
localSelectors.getReferralCouponGUID = (state) => state.referralCouponGUID;

/**
 * Get whether the coupon alert has been closed.
 * @param   {object}    state
 */
localSelectors.hasDismissedCouponAlert = (state) => state.hasDismissedCouponAlert;

/**
 * Returns the anonymous user information for the active ShopState.
 * @param  {Object} state
 * @return {Object} Anonymous user information
 */
localSelectors.getAnonymousUserInformation = (state) => state.anonymousUserInformation;

/**
 * Returns the email address for the anonymous user, if present.
 * @param  {Object} state
 * @return {string} Email address
 */
localSelectors.getAnonymousUserEmail = (state) => {
    const anonymousUserInfo = localSelectors.getAnonymousUserInformation(state);
    return anonymousUserInfo ? anonymousUserInfo.email : null;
};

/**
 * Returns the guid for the active ShopState.
 * @param  {Object} state
 * @return {String} ShopState guid
 */
localSelectors.getShopStateGUID = (state) => state.guid;

/**
 * Returns the unique guid for this client session
 * @param   {object}  state
 * @returns {string}  Session guid
 */
localSelectors.getClientSessionGUID = (state) => state.clientSessionGUID;

/**
 * Returns a list of slugs for public collections. These collections used to be displayed in a dropdown in the header,
 * hence the name, but now they are only used as a list of public collections which we provide for SDK users in the
 * loadPartnerCollections operation. We should probably change this to use our newer public template browser collections instead,
 * but I'm going to just leave this note for now until we can get back to it.
 * @param  {Object}   state
 * @return {[string]}   Array of collection slugs.
 */
localSelectors.getHeaderCollections = (state) => state.headerCollections;

/**
 * Returns error related to fetching a coupon.
 * @param {Object}   state
 * @return {Object} error object
 */
localSelectors.getCouponFetchError = (state) => state.couponFetchError;

/**
 * Returns whether we're currently fetching a coupon.
 * @param {Object}   state
 * @return {boolean}
 */
localSelectors.isFetchingCoupon = (state) => state.isFetchingCoupon;

/**
 * Returns third party configuration for the given name. This is a good place to put
 * application IDs, URLs, and other items of information that are configured on the
 * server but also needed on the backend.
 * @param {Object}   state
 * @return {any}
 */
localSelectors.getThirdPartyConfigByName = (state, configName) =>
    _.get(state.thirdPartyConfig, configName);

/**
 * Returns the shop state branding profile.
 * @param  {Object}     state
 * @return {Object}     Branding profile.
 */
localSelectors.getBrandingProfile = (state) => state.brandingProfile || {};

/**
 * Returns the branding profile's partner slug
 *
 * @param {Object} state
 * @returns {string}  Partner slug
 */
localSelectors.getBrandingProfilePartnerSlug = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'partner_slug', null);
};

/**
 * Returns whether the user has a partner in their branding profile, meaning they're on a partner site
 *
 * @param {object}  state
 * @returns {bool}  Whether the user has a partner in their branding profile
 */
localSelectors.getIsOnPartnerSite = (state) =>
    Boolean(localSelectors.getBrandingProfilePartnerSlug(state));

/**
 * Returns whether the branding profile is whitelabeled, meaning certain content should be hidden
 * such as header/footer links that we wouldn't want to show to the partner
 * @param   {object}  state
 * @return  {bool}    Whether the branding profile is whitelabeled
 */
localSelectors.getBrandingProfileIsSiteWhitelabeled = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'is_site_whitelabeled', false);
};

/**
 * Returns whether the branding profile is invoiced.
 * @param   {object}    state
 * @return  {bool}      Whether the branding profile is invoiced.
 */
localSelectors.getBrandingProfileIsInvoiced = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'is_invoiced', false);
};

/**
 * Returns whether the branding profile includes white labeled previews
 * @param   {object}    state
 * @return  {bool}      Whether the branding profile has white labeled previews
 */
localSelectors.getBrandingProfileHasPreviewWhiteLabeling = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'has_preview_white_labeling', false);
};

/**
 * Returns whether the branding profile is for a private partner site
 * which requires the user to be logged into a valid partner to access
 * @param {object}  state
 * @returns {bool}  Whether the branding profile says the user is on a private partner site
 */
localSelectors.getBrandingProfileIsPrivateParterSite = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'is_private_partner_site', false);
};

/**
 * Returns the URL of the logo to display in the header from the shop state branding profile, if one is present
 *
 * @param   {object}    state
 * @return  {string}    Header logo URL, or null
 */
localSelectors.getBrandingHeaderLogo = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'header_logo', null);
};

/**
 * Returns whether the branding profile has a TV-only integration
 * @param {object}  state
 * @return {bool}   Returns whether the branding profile has a TV-only integration or not
 */
localSelectors.getBrandingProfileHasTVOnly = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'is_tv_only_integration', false);
};

/**
 * Retuns whether the current branded account uses SSO to log in rather than using our regular
 * account/login system. If SSO is being used we will remove things like login/logout buttons and
 * the account details page
 *
 * @param   {object}    state
 * @return  {bool}      Whether the user has an SSO account
 */
localSelectors.getBrandingIsSSO = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'is_sso', false);
};

/**
 * Returns whether branding profile has watermarked draft previews enabled, meaning we should
 * allow the user to download preview render video files for their drafts and display those rendered
 * videos on preview pages in place of our renderer.
 *
 * @param {Object} state
 * @returns {bool}  Whether the branding profile has watermarked draft previews
 */
localSelectors.getHasWatermarkedDraftPreviews = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);
    return _.get(brandingProfile, 'has_watermarked_draft_previews', false);
};

/**
 * Takes a URL path for a CMS page and inserts the partner's branded CMS directory
 * in front of it if the user has a partner with branded CMS pages
 *
 * @param   {object}  state
 * @param   {string}  cmsPath   URL path for the CMS page
 * @returns {string}  path for CMS page formatted with branded directory if necessary
 */
localSelectors.getBrandedCmsURL = (state, cmsPath) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    if (brandingProfile.is_cms_branded && brandingProfile.partner_slug) {
        return `/partner/${brandingProfile.partner_slug}${cmsPath}`;
    }

    return cmsPath;
};

/**
 * Returns array of private collection slugs for the user's partner from their branding profile
 *
 * @param {object} state
 * @returns {string[]}  Array of collection slug strings
 */
localSelectors.getBrandingProfilePrivateCollectionSlugs = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'private_collection_slugs', []) || [];
};

/**
 * Returns text to display in the Auto Personalization panel for partner users.
 *
 * @param {object} state
 * @returns {string}
 */
localSelectors.getBrandingProfilePersonalizationText = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'personalization_terms_text');
};

/**
 * Returns text to display for the NPS prompt in the CheckoutSuccessNPSPromptView, if the user's
 * partner has custom text they would like to apply intead of our default Waymark-branded text.
 *
 * @param {Object} state
 * @returns {string}  The NPS prompt text to use
 */
localSelectors.getBrandingProfileNPSPrompt = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'nps_prompt_text');
};

/**
 * Returns a configuration object describing any custom content we should use for the template browser
 * for this user, if applicable
 *
 * @param {Object} state
 * @returns {Object}
 */
localSelectors.getBrandingProfileTemplateBrowserConfiguration = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'template_browser_configuration');
};

/**
 * Returns manually requested VideoAssetLibrary slugs. This will not contain slugs that are automatically
 * loaded due to existing in the user's account group.
 * @param  {object}        state
 * @return {Array{}}       Array of VideoAssetLibrary slugs.
 */
localSelectors.getEditorVideoAssetLibrarySlugs = (state) => state.editorVideoAssetLibrarySlugs;

/**
 * Returns array of global audio libraries.
 * @param  {object}        state
 * @return {Array{}}       Array of global audio library objects.
 */
localSelectors.getGlobalAudioLibraries = (state) => state.globalAudioLibraries;

/**
 * Whether or not the current session is in the admin portal
 *
 * @param {Object} state
 * @returns {boolean}
 */
localSelectors.isAdminPortal = (state) => state.isAdminPortal;

/**
 * Returns whether or not the partner should hide auto-personalize
 *
 * @param {Object} state
 * @returns {Object}
 */
localSelectors.getBrandingProfileShouldHideBusinessPersonalization = (state) => {
    const brandingProfile = localSelectors.getBrandingProfile(state);

    return _.get(brandingProfile, 'should_hide_business_personalization', false);
};

export default localSelectors;

// Export global selectors.
const moduleName = 'shop';
const localPath = stateKeys[moduleName];

export const getReferralCouponCode = globalizeSelector(
    localSelectors.getReferralCouponCode,
    localPath,
);
export const getReferralCouponGUID = globalizeSelector(
    localSelectors.getReferralCouponGUID,
    localPath,
);
export const getActiveCoupon = globalizeSelector(localSelectors.getActiveCoupon, localPath);
export const getActiveCouponGUID = globalizeSelector(localSelectors.getActiveCouponGUID, localPath);
export const isCreditCardRequiredForActiveCoupon = globalizeSelector(
    localSelectors.isCreditCardRequiredForActiveCoupon,
    localPath,
);
export const getAnonymousUserEmail = globalizeSelector(
    localSelectors.getAnonymousUserEmail,
    localPath,
);
export const getAnonymousUserInformation = globalizeSelector(
    localSelectors.getAnonymousUserInformation,
    localPath,
);
export const getClientSessionGUID = globalizeSelector(
    localSelectors.getClientSessionGUID,
    localPath,
);
export const getShopStateGUID = globalizeSelector(localSelectors.getShopStateGUID, localPath);
export const hasDismissedCouponAlert = globalizeSelector(
    localSelectors.hasDismissedCouponAlert,
    localPath,
);
export const getHeaderCollections = globalizeSelector(
    localSelectors.getHeaderCollections,
    localPath,
);
export const getCouponFetchError = globalizeSelector(localSelectors.getCouponFetchError, localPath);
export const isFetchingCoupon = globalizeSelector(localSelectors.isFetchingCoupon, localPath);
export const getThirdPartyConfigByName = globalizeSelector(
    localSelectors.getThirdPartyConfigByName,
    localPath,
);
export const getBrandingProfile = globalizeSelector(localSelectors.getBrandingProfile, localPath);
export const getBrandingProfilePartnerSlug = globalizeSelector(
    localSelectors.getBrandingProfilePartnerSlug,
    localPath,
);
export const getIsOnPartnerSite = globalizeSelector(localSelectors.getIsOnPartnerSite, localPath);
export const getBrandingProfileIsSiteWhitelabeled = globalizeSelector(
    localSelectors.getBrandingProfileIsSiteWhitelabeled,
    localPath,
);
export const getBrandingProfileIsInvoiced = globalizeSelector(
    localSelectors.getBrandingProfileIsInvoiced,
    localPath,
);
export const getBrandingProfileHasPreviewWhiteLabeling = globalizeSelector(
    localSelectors.getBrandingProfileHasPreviewWhiteLabeling,
    localPath,
);
export const getBrandingProfileIsPrivateParterSite = globalizeSelector(
    localSelectors.getBrandingProfileIsPrivateParterSite,
    localPath,
);
export const getBrandingHeaderLogo = globalizeSelector(
    localSelectors.getBrandingHeaderLogo,
    localPath,
);
export const getBrandingProfileHasTVOnly = globalizeSelector(
    localSelectors.getBrandingProfileHasTVOnly,
    localPath,
);
export const getBrandingIsSSO = globalizeSelector(localSelectors.getBrandingIsSSO, localPath);
export const getHasWatermarkedDraftPreviews = globalizeSelector(
    localSelectors.getHasWatermarkedDraftPreviews,
    localPath,
);
export const getBrandedCmsURL = globalizeSelector(localSelectors.getBrandedCmsURL, localPath);
export const getBrandingProfilePrivateCollectionSlugs = globalizeSelector(
    localSelectors.getBrandingProfilePrivateCollectionSlugs,
    localPath,
);
export const getBrandingProfilePersonalizationText = globalizeSelector(
    localSelectors.getBrandingProfilePersonalizationText,
    localPath,
);
export const getBrandingProfileNPSPrompt = globalizeSelector(
    localSelectors.getBrandingProfileNPSPrompt,
    localPath,
);
export const getBrandingProfileTemplateBrowserConfiguration = globalizeSelector(
    localSelectors.getBrandingProfileTemplateBrowserConfiguration,
    localPath,
);
export const getEditorVideoAssetLibrarySlugs = globalizeSelector(
    localSelectors.getEditorVideoAssetLibrarySlugs,
    localPath,
);
export const getGlobalAudioLibraries = globalizeSelector(
    localSelectors.getGlobalAudioLibraries,
    localPath,
);
export const isAdminPortal = globalizeSelector(localSelectors.isAdminPortal, localPath);
export const getBrandingProfileShouldHideBusinessPersonalization = globalizeSelector(
    localSelectors.getBrandingProfileShouldHideBusinessPersonalization,
    localPath,
);