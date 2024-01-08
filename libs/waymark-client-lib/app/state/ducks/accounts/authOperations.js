// Vendor
import _ from 'lodash';

// Local
import {
    goToInternalURL
} from 'app/utils/urls.js';
import * as loginActionNames from 'app/constants/LoginActionNames.js';
import {
    newAccountEvent
} from 'app/constants/ConversionEvents.js';
import {
    sessionStorageKeys
} from 'app/constants/SessionStorage';
import {
    safeSessionStorage
} from 'shared/utils/safeStorage';
import {
    trackFacebookPixelEvent
} from 'app/utils/facebookPixel.js';
import GoogleAdsService from 'app/services/GoogleAdsService.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    appURLs,
    queryParams
} from 'app/constants/urls.js';
import loginActionActions from 'app/state/ducks/loginActions/actions.js';
import shopActions from 'app/state/ducks/shop/actions.js';
import shopOperations from 'app/state/ducks/shop/operations.js';
import {
    createAccount,
    login,
    sdkLogin,
    createSDKAccount,
    logout,
    resetEmail,
    resetPassword,
    sendPasswordRecoveryEmail,
    updateAccount,
} from 'shared/api/index.js';

import {
    parseQueryParams,
    goToExternalURL
} from 'shared/utils/urls.js';
import accountActions from './actions.js';

const LOGIN_ACTION_MAP = {
    [loginActionNames.saveVideoSpecAsDraft]: shopOperations.addVideoSpecToSavedDrafts,
};

const updateShopStateAndAccount = (loggedInAccountData) => async (dispatch) => {
    const {
        account,
        branding_profile: brandingProfile,
        shop_state_guid: shopStateGUID,
        selected_business_guid: selectedBusinessGUID,
    } = loggedInAccountData;

    if (shopStateGUID) {
        // Update the shop state guid
        await dispatch(shopActions.updateShopState(shopStateGUID));
    }

    dispatch(accountActions.receivedAccount(account));

    // Set a "dirty" flag on our reducers to tell them to re-fetch when needed.
    dispatch(shopActions.requestDataRefresh());

    if (brandingProfile && !shopStateGUID) {
        dispatch(shopActions.receivedBrandingProfile(brandingProfile));
    } else if (shopStateGUID) {
        // Re-load the app state to ensure the site reflects the newly logged-in account.
        await dispatch(
            shopOperations.loadAppState({
                accountGUID: account.guid,
                brandingProfile,
                shopStateGUID,
                selectedBusinessGUID,
            }),
        );
    }

    return account;
};

/**
 * @name sdkAccountLogin
 *
 * Attempt to login an SDK user and update the shop state with their information.
 *
 * @param {string}  sdkPartnerID   AccountPartner SDK partner ID.
 * @param {string}  signedJWT   JSON web token signed with a secret key containing necessary info for logging in an SDK user
 */
const sdkAccountLogin = (sdkPartnerID, signedJWT) => async (dispatch) => {
    try {
        // Call the SDK login API method and make sure the shop state is updated with the account
        const accountData = await sdkLogin({
            sdkPartnerID,
            signedJWT
        });
        return dispatch(updateShopStateAndAccount(accountData));
    } catch (error) {
        console.error('An error occurred while attempting to log in an SDK user', error);
        // Throw an error if it comes up so the consumer can handle it
        throw error;
    }
};

/**
 * @name sdkCreateAccount
 *
 * Attempt to create an SDK user account and update the shop state with their information.
 *
 * @param {string}  sdkPartnerID   AccountPartner SDK partner ID.
 * @param {string}  signedJWT     JSON web token signed with a secret key containing necessary info for creating an SDK account
 */
const sdkCreateAccount = (sdkPartnerID, signedJWT) => async (dispatch) => {
    try {
        const accountData = await createSDKAccount({
            sdkPartnerID,
            signedJWT,
        });
        return dispatch(updateShopStateAndAccount(accountData));
    } catch (error) {
        console.error('An error occurred while attempting to create an SDK account', error);
        // Re-throw the error so the consumer can handle it
        throw error;
    }
};

/**
 * @name accountLogin
 *
 * First, Attempt a login using submitted formData.
 * Second, if successful, assign the logged in user to the store state.
 * Third, if successful, Navigate to the /templates page.
 * If there's an error push that to the Page container to handle.
 *
 * @param  {object} formData
 * @param  {boolean} shouldNavigate
 *          Whether to navigate the user away from the page after successful signup
 * @return {number} A userId that will be loaded into the application state as a
 *                  logged in user.
 */
const accountLogin =
    (formData, shouldNavigate = true) =>
    async (dispatch, getState) => {
        try {
            const loginResponse = await login(formData);

            // If the reponse's metadata has the `should_reload_page` flag set to true,
            // this indicates the user we just logged in isn't on the subdomain they belong to.
            // To fix this, we'll simply force a page reload so we can run a fresh GET request through the middleware
            // and get redirected to where the user belongs.
            if (_.get(loginResponse, 'data.meta.should_reload_page', false)) {
                window.location.reload();
                return null;
            }

            const accountData = loginResponse.data.data;

            const currentQueryParameters = parseQueryParams();
            if (currentQueryParameters.next_url) {
                // If a next_url query param is set, split it to get the path and any query params, if applicable
                const [nextURLPath, nextURLQueryParams] = decodeURIComponent(
                    currentQueryParameters.next_url,
                ).split('?');

                await dispatch(
                    loginActionActions.addLoginAction({
                        name: loginActionNames.navigateToPage,
                        args: [],
                        nextURL: nextURLPath,
                        nextSearch: nextURLQueryParams ? `?${nextURLQueryParams}` : null,
                    }),
                );

                // Remove the next_url param now that we've created a login action out of it
                delete currentQueryParameters.next_url;
            }

            await dispatch(updateShopStateAndAccount(accountData));
            const {
                account
            } = accountData;

            // If we're using the signup operation outside of the context of the signup UI,
            // (e.g., during purchase), let's be sure we don't navigate the user away from their
            // current location.
            if (!shouldNavigate) {
                return account;
            }

            // If we were provided an action to run after the user logs in, let's do it!
            const storeState = getState();

            if (selectors.hasLoginAction(storeState)) {
                // Retrieve the login action to execute.
                const {
                    name,
                    args,
                    nextURL,
                    nextSearch
                } = selectors.getLoginAction(storeState);
                const operation = LOGIN_ACTION_MAP[name];
                let operationResponse;

                // Only attempt to dispatch the operation if we have one.
                if (operation) {
                    operationResponse = await dispatch(operation(...args));
                }

                // Clear the login action and navigate the user wherever they need to go.
                dispatch(loginActionActions.clearLoginAction());

                // If the login action includes search params to apply as well, parse those out so we can merge them
                // with the current query params
                const nextQueryParameters = nextSearch ? parseQueryParams(nextSearch) : null;

                const adminOverrideQueryParamValue =
                    currentQueryParameters[queryParams.adminOverrideAccountGUID];
                // Merge current and next query params and ensure the `next_url` param is removed if present
                let parsedQueryParams = { ...currentQueryParameters,
                    ...nextQueryParameters
                };

                if (adminOverrideQueryParamValue) {
                    // It is an active admin override session if an admin_account_override_guid
                    // is present in the query parameters, and the serialized account returned by
                    // the server is NOT the account that tried to login.
                    if (account.email_address !== formData.emailAddress) {
                        safeSessionStorage.setItem(
                            sessionStorageKeys.adminOverrideAccountGUID,
                            adminOverrideQueryParamValue,
                        );
                    } else {
                        // Otherwise, remove the query param from the URL and ensure the
                        // value (if present) is removed from sessionStorage.
                        parsedQueryParams = _.omit(
                            currentQueryParameters,
                            queryParams.adminOverrideAccountGUID,
                        );
                        safeSessionStorage.removeItem(sessionStorageKeys.adminOverrideAccountGUID);
                    }
                }

                goToInternalURL(nextURL || operationResponse, false, parsedQueryParams);
            } else {
                // Redirect to Waymark AI by default
                goToInternalURL(appURLs.ai);
            }

            return account;
        } catch (error) {
            console.error('An error occurred while attempting to log in:', error);
            // We'll rethrow the error so that it can be handled on the page container
            // level rather than in the store.
            throw error;
        }
    };

/**
 * @name accountLogout
 *
 * First we'll logout off the backend server.
 * Second we'll dispatch the logout action, which will set the application state userid to null
 * Third we'll clear the session.
 * Fourth we'll navigate to home, this will create a *new* shop state in the session.
 * If there's an error push that to the Page container to handle.
 *
 * @param {string | null} [nextURL=null] - The URL to navigate to after logging out; if null, the user won't be redirected
 */
const accountLogout =
    (nextURL = null) =>
    async (dispatch) => {
        try {
            await logout();
            dispatch(accountActions.logoutAccount());
            if (nextURL) {
                goToExternalURL(nextURL);
            }
        } catch (error) {
            console.error('An error occurred while attempting to log out:', error);
            // We'll rethrow the error so that it can be handled on the page container
            // level rather than in the store.
            throw error;
        }
    };

/**
 * @name signup
 *
 * Create an account, if successful navigate to the homepage with the new Account
 * loaded into the store. If we fail throw the error to be caught in the calling
 * container.
 *
 * @param  {object} accountData { emailAddress, password, accountGroupInviteCode }
 * @param  {boolean} shouldNavigate
 *          Whether to navigate the user away from the page after successful signup
 * @return {dict}            If there are no errors, the account is loaded into app state.
 *                           If there is an error fetching the account, no account is loaded
 *                           into state and a dictionary containing the error information is
 *                           loaded into app state.
 */
const signup =
    (accountData, shouldNavigate = true) =>
    async (dispatch, getState) => {
        // Create Account
        try {
            const createdAccountData = await createAccount(accountData);

            await dispatch(updateShopStateAndAccount(createdAccountData));

            const {
                account
            } = createdAccountData;

            trackFacebookPixelEvent(newAccountEvent);
            GoogleAdsService.trackConversion({
                conversionName: newAccountEvent,
                value: 0,
                transactionID: account.guid,
            });

            // If we're using the signup operation outside of the context of the signup UI,
            // (e.g., during purchase), let's be sure we don't navigate the user away from their
            // current location.
            if (!shouldNavigate) {
                return account;
            }

            // If we were provided an action to run after the user logs in, let's do it!
            const storeState = getState();
            if (selectors.hasLoginAction(storeState)) {
                // Retrieve the login action to execute.
                const {
                    name,
                    args,
                    nextURL
                } = selectors.getLoginAction(storeState);
                const operation = LOGIN_ACTION_MAP[name];
                let operationResponse;

                // Only attempt to dispatch the operation if we have one.
                if (operation) {
                    operationResponse = await dispatch(operation(...args));
                }
                // Clear the login action and navigate the user wherever they need to go.
                dispatch(loginActionActions.clearLoginAction());
                goToInternalURL(nextURL || operationResponse);
            } else {
                // Redirect to Waymark AI by default
                goToInternalURL(appURLs.ai);
            }

            return account;
        } catch (error) {
            console.error('An error occurred while attempting to sign up:', error);
            // If we fail throw the error to be caught in the calling container.
            throw error;
        }
    };

/**
 * A function to send an email with a link to reset an account's password.
 * @param  {string}   accountEmailAddress     Address that email should be sent to. Also needs to be
 *                                            associated with a known account.
 * @return                                    If there are no errors, nothing is loaded into state.
 *                                            If there is an error sending the email, the error
 *                                            information is loaded into state.
 */
const sendPasswordResetEmail = (accountEmailAddress) => async (dispatch) => {
    dispatch(accountActions.sendingPasswordResetEmail());
    try {
        await sendPasswordRecoveryEmail(accountEmailAddress);
        dispatch(accountActions.sendPasswordResetEmailComplete());
    } catch (error) {
        dispatch(accountActions.sendPasswordResetEmailError());
        // If we fail throw the error to be caught in the calling container.
        throw error;
    }
};

/**
 * A function to kick off resetting an account's password.
 * @param  {string}   accountGUID   The selected account's guid.
 * @param  {string}   newPassword)  The user's new raw password.
 */
const resetAccountPassword =
    (accountGUID, newPassword, shouldCheckCurrentPassword, currentPassword) => async (dispatch) => {
        dispatch(accountActions.resettingPassword());
        try {
            await resetPassword(accountGUID, newPassword, shouldCheckCurrentPassword, currentPassword);
            dispatch(accountActions.resetPasswordComplete());
            setTimeout(() => {
                dispatch(accountActions.revertPasswordResetTimeout());
            }, 5000);
        } catch (error) {
            dispatch(accountActions.resetPasswordError());
            // If we fail throw the error to be caught in the calling container.
            throw error;
        }
    };

/**
 * A function to kick off resetting an account's email.
 * @param  {string}   accountGUID   The selected account's guid.
 * @param  {string}   newPassword)  The user's new raw password.
 */
const resetAccountEmail = (accountGUID, newEmail, password) => async (dispatch) => {
    try {
        await resetEmail(accountGUID, newEmail, password);
        dispatch(accountActions.resetEmailComplete(newEmail));
        setTimeout(() => {
            dispatch(accountActions.revertEmailResetTimeout());
        }, 5000);
    } catch (error) {
        // If we fail throw the error to be caught in the calling container.
        dispatch(accountActions.resetEmailError());
        throw error;
    }
};

/**
 * Operation used by the post-purchase page in the event that we created an account
 * for the user with a temporary password.
 * @param  {string} accountGUID GUID for the account that purchased
 * @param  {string} newPassword New password provided by the user.
 * @return {Promise}
 */
const resetAccountPasswordAfterPurchase = (accountGUID, newPassword) => async (dispatch) => {
    try {
        await dispatch(resetAccountPassword(accountGUID, newPassword, false));
    } catch (error) {
        console.error(error);
        console.error(`Unable to reset password for account ${accountGUID}.`);
        throw error;
    }
};

/**
 *
 * @param {string} accountGUID GUID of account to be updated
 * @param {dict} updatedAccountInfo Dictionary of updated account values
 * @returns
 */
const updateAccountInfo = (accountGUID, updatedAccountInfo) => async (dispatch) => {
    let account;

    try {
        const response = await updateAccount(accountGUID, updatedAccountInfo);
        ({
            account
        } = response);

        dispatch(accountActions.receivedAccount(account));

        return account;
    } catch (error) {
        console.error(error);
        console.error(`Unable to update info for account ${accountGUID}.`);
        throw error;
    }
};

/**
 * Operation used by the post-purchase page to update account data
 * @param  {Object} account
 * @param  {string} account.accountGUID     GUID for the account that purchased
 * @param  {string} account.newPassword     New password provided by the user.
 * @param  {string} account.name            New name provided by the user.
 * @param  {string} account.newCompanyName  new company name provided by the user
 * @return {Promise}
 */
const completeAccountSetup =
    ({
        accountGUID,
        newPassword,
        name,
        newCompanyName
    }) =>
    async (dispatch) => {
        try {
            const {
                email_address: emailAddress
            } = await dispatch(
                updateAccountInfo(accountGUID, {
                    first_name: name,
                    company_name: newCompanyName
                }),
            );
            await dispatch(resetAccountPasswordAfterPurchase(accountGUID, newPassword));
            // Properly log the user into their account now that it's set up
            await dispatch(accountLogin({
                emailAddress,
                password: newPassword
            }, false));
        } catch (error) {
            console.error(error);
            console.error(`Unable to reset password for account ${accountGUID}.`);
            throw error;
        }
    };

export default {
    accountLogin,
    sdkAccountLogin,
    sdkCreateAccount,
    accountLogout,
    signup,
    resetAccountEmail,
    resetAccountPassword,
    resetAccountPasswordAfterPurchase,
    sendPasswordResetEmail,
    completeAccountSetup,
    updateAccountInfo,
};