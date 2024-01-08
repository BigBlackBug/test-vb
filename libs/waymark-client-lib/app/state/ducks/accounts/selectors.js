// Vendor
import _ from 'lodash';
import moment from 'moment';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';
import {
    videoDownloadSubscriptionTypes
} from 'app/constants/Offer.js';
import {
    sessionStorageKeys
} from 'app/constants/SessionStorage';
import {
    safeSessionStorage
} from 'shared/utils/safeStorage';

const localSelectors = {};

/**
 * Get the account loaded into state.
 * @param   {object}    state
 */
localSelectors.getAccount = (state) => state.account;

/**
 * Get the account groups, if any.
 * @param   {object}    state
 */
localSelectors.getAccountGroups = (state) => state.account ? .account_groups ? ? [];

/**
 * Gets the list of VideoAssetLibrary slugs that a given AccountGroup has access to.
 * @param  {object}     state
 * @return {array}      Array of VideoAssetLibrary slugs.
 */
localSelectors.getAccountGroupVideoAssetLibrarySlugs = (state) => {
    const accountGroups = localSelectors.getAccountGroups(state);

    return _.uniq(_.flatMap(accountGroups, 'video_asset_libraries'));
};

/**
 * Get the account loaded into state.
 * @param   {object}    state
 */
localSelectors.getAccountGUID = (state) => (state.account ? state.account.guid : null);

/**
 * Get the email address for the loaded account.
 * @param   {object}    state
 */
localSelectors.getAccountEmail = (state) => (state.account ? state.account.email_address : null);

/**
 * Get the name of the user for the loaded account.
 * @param   {object}    state
 */
localSelectors.getAccountName = (state) => (state.account ? state.account.full_name : null);

/**
 * Get the company name for the loaded account
 * @param   {object}    state
 */
localSelectors.getAccountCompanyName = (state) =>
    state.account ? state.account.company_name : null;

/**
 * Get the user's service access token
 *
 * @param {Object} state
 */
localSelectors.getServiceAccessToken = (state) => state.serviceAccessToken;

/**
 * Get if the loaded account should have a referral discount applied.
 * @param   {object}    state
 */
localSelectors.getAccountHasReferralDiscount = (state) =>
    state.account ? state.account.has_referral_discount : null;

/**
 * Get all of the referred accounts that have signed up with the loaded account's referral URL.
 * @param   {object}    state
 */
localSelectors.getAccountReferrals = (state) => state.referrals;

/**
 * Get the sharable referral url for the loaded account.
 * @param   {object}    state
 */
localSelectors.getAccountReferralURL = (state) =>
    state.account ? state.account.referral_url : null;

/**
 * Get whether the user has an account created through the SDK
 *
 * @param {Object} state
 */
localSelectors.getIsSDKAccount = (state) => (state.account ? state.account.is_sdk_account : false);

/**
 * Determines if a user is logged in.
 * @param      {Object}   state
 * @return     {boolean}  True if logged in, False otherwise.
 */
localSelectors.isLoggedIn = (state) => !_.isEmpty(state.account);

/**
 * Returns whether the request to send a password reset email has completed.
 * @param  {Object} state
 */
localSelectors.isSendingPasswordResetEmail = (state) => state.isSendingPasswordResetEmail;

/**
 * Returns whether the request the account email has been reset.
 * @param  {Object} state
 */
localSelectors.hasResetEmail = (state) => state.hasResetEmail;

/**
 * Returns whether the request to update an account's password is complete.
 * @param  {Object} state
 */
localSelectors.isResettingPassword = (state) => state.isResettingPassword;

/**
 * Returns whether the request to update an account's password is complete.
 * @param  {Object} state
 */
localSelectors.hasResetPassword = (state) => state.hasResetPassword;

/**
 * Whether we're currently fetching the account.
 * @param      {Object}   state
 * @return     {boolean}
 */
localSelectors.isFetchingAccount = (state) => state.isFetchingAccount;

/**
 * Whether we're currently fetching the account's subscriptions.
 * @param     {Object}    state
 * @return    {boolean}
 */
localSelectors.isFetchingSubscription = (state) => state.isFetchingSubscription;

/**
 * Whether we've successfully fetched the account.
 * @param      {Object}   state
 * @return     {boolean}
 */
localSelectors.hasFetchedAccount = (state) => state.hasFetchedAccount;

/**
 * Whether we should request a new password for this account.
 * @param  {Object} state
 * @return {boolean}
 */
localSelectors.shouldResetAccountPassword = (state) => state.shouldRequestPasswordReset;

/**
 * Check whether or not an account has made a purchase.
 * @param  {Object} state
 */
localSelectors.hasMadePurchase = (state) =>
    Boolean(state.account && state.account.first_purchased_at);

/**
 * Returns formatted card details for the account, if present.
 * @param  {Object} state
 * @return {CardDisplayDetails}
 *         Object of credit card info for diplay purposes only.
 */
localSelectors.getAccountCardDisplayDetails = (state) => {
    const account = localSelectors.getAccount(state);
    if (account && !_.isEmpty(account.card_display_info)) {
        const displayInfo = account.card_display_info;
        const monthName = moment(displayInfo.expiration_month, 'M').format('MMMM');

        return {
            provider: displayInfo.service_provider,
            last4: displayInfo.last_four_digits,
            cardExp: `${monthName} ${displayInfo.expiration_year}`,
        };
    }

    return {};
};

/**
 * Returns whether this account has a stored credit card or not.
 * @param  {Object} state
 * @return {Boolean} True if the account has a stored card.
 */
localSelectors.hasStoredCreditCard = (state) =>
    !_.isEmpty(localSelectors.getAccountCardDisplayDetails(state));

/**
 * Returns a list of FacebookManagedAdSubscription objects
 * @param {object}  state
 */
localSelectors.getAccountFacebookAdSubscriptions = (state) => state.facebookAdSubscriptions;

/**
 * Returns a list of videoDownloadSubscription objects.
 * @param  {Object} state
 * @return {VideoDownloadSubscription[]} The account's video download subscriptions
 */
localSelectors.getAccountVideoDownloadSubscriptions = (state) => state.videoDownloadSubscriptions;

/**
 * Returns a combined list of all facebook ad subscriptions and video download subscriptions
 * @param {object}  state
 */
localSelectors.getAllAccountSubscriptions = (state) =>
    localSelectors
    .getAccountVideoDownloadSubscriptions(state)
    .concat(localSelectors.getAccountFacebookAdSubscriptions(state));

/**
 * Returns a boolean based on whether or not the user has any video download
 * subscriptions with zero credits.
 * @param {object}  state
 */
localSelectors.getHasZeroCreditSubscription = (state) => {
    const videoDownloadSubscriptions = localSelectors.getAccountVideoDownloadSubscriptions(state);

    return Boolean(
        videoDownloadSubscriptions.find((subscription) => subscription.videoCredits === 0),
    );
};

/**
 * Returns any collections this account's group has associated with it.
 *
 * @param   {Object}  state
 * @return  {Array}   An array of the lightweight collections (slug, display_name_short, poster
 URL).
 */
localSelectors.getAccountCollections = (state) => {
    const accountGroups = localSelectors.getAccountGroups(state);

    return _.uniq(_.flatMap(accountGroups, 'variant_groups'));
};

/**
 * Returns the slugs for any collections this account's group has associated with it.
 *
 * @param   {Object}  state
 * @return  {Array}   An array of the collection slugs.
 */
localSelectors.getAccountCollectionSlugs = (state) => {
    const collections = localSelectors.getAccountCollections(state);

    return _.map(collections, 'slug');
};

/**
 * Returns the videoDownloadSubscription object which matches a given subscription type,
 * if the account has one
 *
 * @param   {Object}  state
 * @param   {string}  subscriptionType    The video download subscription type we are looking for
 * @return  {VideoDownloadSubscription}   The video download subscription matching the given type
 */
localSelectors.getVideoDownloadSubscriptionByType = (state, subscriptionType) => {
    const videoDownloadSubscriptions = localSelectors.getAccountVideoDownloadSubscriptions(state);

    return videoDownloadSubscriptions.find(
        (subscription) => subscription.subscriptionType === subscriptionType,
    );
};

/**
 * Gets all of a users premiere enabled subscriptions and then returns just the first one
 * since our UI is really only equipped for one premiere subscription currently.
 *
 * @param  {Object}  state
 * @return {Object}  Premiere enabled subscription
 */
localSelectors.getPremiereSubscription = (state) =>
    /**
     * NOTABLE ASSUMPTION ALERT
     * We're assuming that an account only has one premiere subscription from here forward.
     * This is represented in the ui by only allowing one field for next payment and next credit in drop downs.
     * In the event that future accounts get multiple premiere subscriptions this will ONLY return the first one from the filter.
     */
    localSelectors.getVideoDownloadSubscriptionByType(state, videoDownloadSubscriptionTypes.premiere);

/**
 * Whether the account has a premiere subscription.
 *
 * @param  {Object} state
 * @return {boolean} True if the account has a Premiere subscription; false otherwise.
 */
localSelectors.hasPremiereSubscription = (state) =>
    Boolean(localSelectors.getPremiereSubscription(state));

/**
 * Whether the account has a lifetime deal subscription.
 *
 * @param  {Object} state
 * @return {boolean} True if the account has Lifetime Deal; false otherwise.
 */
localSelectors.hasLifetimeDealSubscription = (state) =>
    Boolean(
        localSelectors.getVideoDownloadSubscriptionByType(
            state,
            videoDownloadSubscriptionTypes.lifetimeDeal,
        ),
    );

/**
 * Whether the account has a pro subscription.
 *
 * @param  {Object} state
 * @return {boolean} True if the account has a pro subscription; false otherwise.
 */
localSelectors.hasProSubscription = (state) =>
    Boolean(
        localSelectors.getVideoDownloadSubscriptionByType(state, videoDownloadSubscriptionTypes.pro),
    );

/**
 * Whether the account has a video download subscription of any kind
 *
 * @param   {Object}  state
 * @return  {boolean} Whether the account has a video download subscription of any kind
 */
localSelectors.hasVideoDownloadSubscription = (state) =>
    !_.isEmpty(localSelectors.getAccountVideoDownloadSubscriptions(state));

/**
 * Returns the next payment date for premiere
 *
 * @param  {Object} state
 * @return {Date}   Returns the date of the state's account next premiere payment date
 */
localSelectors.getPremiereNextPaymentDate = (state) => {
    const premiereSubscription = localSelectors.getPremiereSubscription(state);

    // If we have premiere subscriptions continue.
    if (premiereSubscription) {
        // This will return the next premiere subscription's payment date.
        return premiereSubscription.nextPayment;
    }
    // No premiere subscriptions means no next payment date.
    return null;
};

/**
 * Returns the next credit dispersal date for premiere
 * Notable limitation now is the assumption of one premiere
 *
 * @param  {Object} state
 * @return {boolean} True if the account has Premiere; false otherwise.
 */
localSelectors.getPremiereNextCreditDate = (state) => {
    const premiereSubscription = localSelectors.getPremiereSubscription(state);

    // If we have premiere subscriptions continue.
    if (premiereSubscription) {
        // This will return the next premiere subscription's credit dispersal date.
        return premiereSubscription.nextCredits;
    }
    // No premiere subscriptions means no next credits date.
    return null;
};

/**
 * Returns whether or not the account has permission to manage related Partner or AccountGroup accounts.
 * @param  {Object}        state
 * @return {boolean}
 */
localSelectors.getCanManageClientAccounts = (state) => {
    const canManagePartnerAcounts = _.get(
        state.account,
        'can_manage_related_partner_accounts',
        false,
    );
    const canManageAccountGroupAcounts = _.get(
        state.account,
        'can_manage_related_account_group_accounts',
        false,
    );

    return canManageAccountGroupAcounts || canManagePartnerAcounts;
};

/**
 * Returns whether or not the account currently in use is using a session override
 * @param {object}  state
 * @returns {boolean}
 */
localSelectors.isUsingAccountOverride = (state) => {
    const accountGUID = localSelectors.getAccountGUID(state);
    const sessionAccountOverrideGUID = safeSessionStorage.getItem(
        sessionStorageKeys.adminOverrideAccountGUID,
    );

    // If we have an account GUID and a session override GUID and they match,
    // we're using an account override
    return (
        Boolean(accountGUID && sessionAccountOverrideGUID) && accountGUID === sessionAccountOverrideGUID
    );
};

/**
 * Returns whether or not the account is associated with a Partner.
 * @param  {object} state
 * @return {boolean}
 */
localSelectors.isAccountAssociatedWithPartner = (state) => Boolean(state.account.partner);

/**
 * Returns the RolePermissions object
 * @param   {object}  state
 * @return  {object}
 */
localSelectors.getRolePermissions = (state) => state.account ? .role_permissions ? ? {};

/**
 * Returns whether the current user is a staff account
 * @param   {object}  state
 * @return  {object}
 */
localSelectors.isStaff = (state) => localSelectors.getRolePermissions(state) ? .is_staff ? ? false;

export default localSelectors;

// Export global selectors.
const moduleName = 'accounts';
const localPath = stateKeys[moduleName];

export const getAccount = globalizeSelector(localSelectors.getAccount, localPath);
export const getAccountGroups = globalizeSelector(localSelectors.getAccountGroups, localPath);
export const getAccountGroupVideoAssetLibrarySlugs = globalizeSelector(
    localSelectors.getAccountGroupVideoAssetLibrarySlugs,
    localPath,
);
export const getAccountEmail = globalizeSelector(localSelectors.getAccountEmail, localPath);
export const getAccountName = globalizeSelector(localSelectors.getAccountName, localPath);
export const getAccountCompanyName = globalizeSelector(
    localSelectors.getAccountCompanyName,
    localPath,
);
export const getServiceAccessToken = globalizeSelector(
    localSelectors.getServiceAccessToken,
    localPath,
);
export const getAccountGUID = globalizeSelector(localSelectors.getAccountGUID, localPath);
export const getAccountHasReferralDiscount = globalizeSelector(
    localSelectors.getAccountHasReferralDiscount,
    localPath,
);
export const getAccountReferrals = globalizeSelector(localSelectors.getAccountReferrals, localPath);
export const getAccountReferralURL = globalizeSelector(
    localSelectors.getAccountReferralURL,
    localPath,
);
export const getIsSDKAccount = globalizeSelector(localSelectors.getIsSDKAccount, localPath);
export const hasFetchedAccount = globalizeSelector(localSelectors.hasFetchedAccount, localPath);
export const hasMadePurchase = globalizeSelector(localSelectors.hasMadePurchase, localPath);
export const isFetchingAccount = globalizeSelector(localSelectors.isFetchingAccount, localPath);
export const isFetchingSubscription = globalizeSelector(
    localSelectors.isFetchingSubscription,
    localPath,
);
export const isLoggedIn = globalizeSelector(localSelectors.isLoggedIn, localPath);
export const isResettingPassword = globalizeSelector(localSelectors.isResettingPassword, localPath);
export const isSendingPasswordResetEmail = globalizeSelector(
    localSelectors.isSendingPasswordResetEmail,
    localPath,
);
export const shouldResetAccountPassword = globalizeSelector(
    localSelectors.shouldResetAccountPassword,
    localPath,
);
export const getAccountCardDisplayDetails = globalizeSelector(
    localSelectors.getAccountCardDisplayDetails,
    localPath,
);
export const hasStoredCreditCard = globalizeSelector(localSelectors.hasStoredCreditCard, localPath);
export const getAccountCollections = globalizeSelector(
    localSelectors.getAccountCollections,
    localPath,
);
export const getAccountCollectionSlugs = globalizeSelector(
    localSelectors.getAccountCollectionSlugs,
    localPath,
);
export const getAccountFacebookAdSubscriptions = globalizeSelector(
    localSelectors.getAccountFacebookAdSubscriptions,
    localPath,
);
export const getAccountVideoDownloadSubscriptions = globalizeSelector(
    localSelectors.getAccountVideoDownloadSubscriptions,
    localPath,
);
export const getAllAccountSubscriptions = globalizeSelector(
    localSelectors.getAllAccountSubscriptions,
    localPath,
);
export const getHasZeroCreditSubscription = globalizeSelector(
    localSelectors.getHasZeroCreditSubscription,
    localPath,
);
export const getPremiereSubscription = globalizeSelector(
    localSelectors.getPremiereSubscription,
    localPath,
);
export const getLifetimeDealSubscription = globalizeSelector(
    localSelectors.getLifetimeDealSubscription,
    localPath,
);
export const getPremiereNextPaymentDate = globalizeSelector(
    localSelectors.getPremiereNextPaymentDate,
    localPath,
);
export const getPremiereNextCreditDate = globalizeSelector(
    localSelectors.getPremiereNextCreditDate,
    localPath,
);
export const getVideoDownloadSubscriptionByType = globalizeSelector(
    localSelectors.getVideoDownloadSubscriptionByType,
    localPath,
);
export const hasPremiereSubscription = globalizeSelector(
    localSelectors.hasPremiereSubscription,
    localPath,
);
export const hasLifetimeDealSubscription = globalizeSelector(
    localSelectors.hasLifetimeDealSubscription,
    localPath,
);
export const hasVideoDownloadSubscription = globalizeSelector(
    localSelectors.hasVideoDownloadSubscription,
    localPath,
);
export const hasResetPassword = globalizeSelector(localSelectors.hasResetPassword, localPath);
export const hasResetEmail = globalizeSelector(localSelectors.hasResetEmail, localPath);
export const getCanManageClientAccounts = globalizeSelector(
    localSelectors.getCanManageClientAccounts,
    localPath,
);
export const isUsingAccountOverride = globalizeSelector(
    localSelectors.isUsingAccountOverride,
    localPath,
);
export const isAccountAssociatedWithPartner = globalizeSelector(
    localSelectors.isAccountAssociatedWithPartner,
    localPath,
);
export const getRolePermissions = globalizeSelector(localSelectors.getRolePermissions, localPath);
export const isStaff = globalizeSelector(localSelectors.isStaff, localPath);