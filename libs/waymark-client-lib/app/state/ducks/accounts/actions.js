// Local
import {
    ACCOUNT_FETCH_COMPLETE,
    ACCOUNT_FETCH_ERROR,
    ACCOUNT_FETCH_PENDING,
    ACCOUNT_LOGOUT,
    ACCOUNT_REQUEST_PASSWORD_RESET,
    ACCOUNT_RECEIVED_SERVICE_ACCESS_TOKEN,
    ACCOUNT_RESET_EMAIL_COMPLETE,
    ACCOUNT_RESET_EMAIL_ERROR,
    ACCOUNT_RESET_EMAIL_PENDING,
    ACCOUNT_EMAIL_RESET_TIMEOUT,
    ACCOUNT_RESET_PASSWORD_COMPLETE,
    ACCOUNT_RESET_PASSWORD_ERROR,
    ACCOUNT_RESET_PASSWORD_PENDING,
    ACCOUNT_PASSWORD_RESET_TIMEOUT,
    ACCOUNT_SEND_PASSWORD_RESET_EMAIL_COMPLETE,
    ACCOUNT_SEND_PASSWORD_RESET_EMAIL_ERROR,
    ACCOUNT_SEND_PASSWORD_RESET_EMAIL_PENDING,
    ACCOUNT_SUBSCRIPTIONS_FETCH_COMPLETE,
    ACCOUNT_SUBSCRIPTIONS_FETCH_ERROR,
    ACCOUNT_SUBSCRIPTIONS_FETCH_PENDING,
} from '../../actionTypes.js';

/**
 * Tracks when an account is being fetched.
 */
const fetchingAccount = () => ({
    type: ACCOUNT_FETCH_PENDING,
});

/**
 * Received account from the server.
 * @param  {object}   account   Account.
 */
const receivedAccount = (account) => ({
    type: ACCOUNT_FETCH_COMPLETE,
    payload: account,
});

/**
 * Failed account fetching.
 * @param  {object}  error   Error information.
 */
const failedAccountFetch = (error) => ({
    type: ACCOUNT_FETCH_ERROR,
    payload: error,
});

/**
 * Successfully fetched a service access token for the account
 */
const receivedServiceAccessToken = (accessToken) => ({
    type: ACCOUNT_RECEIVED_SERVICE_ACCESS_TOKEN,
    payload: accessToken,
});

/**
 * Tracks when an account's subscriptions are being fetched.
 */
const fetchingAccountSubscriptions = () => ({
    type: ACCOUNT_SUBSCRIPTIONS_FETCH_PENDING,
});

/**
 * Received an account's subscriptions from the server.
 * @param  {object || array && string}   subscriptions   VideoDownloadSubscriptionProducts data and
 *                                                       or a Facebook Ad Dashboard url.
 */
const receivedAccountSubscriptions = (subscriptions) => ({
    type: ACCOUNT_SUBSCRIPTIONS_FETCH_COMPLETE,
    payload: subscriptions,
});

/**
 * Failed account subscription fetching.
 * @param  {object}  error   Error information.
 */
const failedAccountSubscriptionsFetch = (error) => ({
    type: ACCOUNT_SUBSCRIPTIONS_FETCH_ERROR,
    payload: error,
});

/**
 * Tracks when a password reset email is being sent.
 */
const sendingPasswordResetEmail = () => ({
    type: ACCOUNT_SEND_PASSWORD_RESET_EMAIL_PENDING,
});

/**
 * A password reset email was sent successfully.
 */
const sendPasswordResetEmailComplete = () => ({
    type: ACCOUNT_SEND_PASSWORD_RESET_EMAIL_COMPLETE,
});

/**
 * A password reset email failed to send.
 * @param  {object}   error    Error information.
 */
const sendPasswordResetEmailError = () => ({
    type: ACCOUNT_SEND_PASSWORD_RESET_EMAIL_ERROR,
});

/**
 * Tracks when a password is being reset
 */
const resettingPassword = () => ({
    type: ACCOUNT_RESET_PASSWORD_PENDING,
});

/**
 * An account's password was sent successfully.
 */
const revertPasswordResetTimeout = () => ({
    type: ACCOUNT_PASSWORD_RESET_TIMEOUT,
});

/**
 * An account's password was sent successfully.
 */
const revertEmailResetTimeout = () => ({
    type: ACCOUNT_EMAIL_RESET_TIMEOUT,
});

/**
 * An account's email was sent successfully.
 */
const resetEmailComplete = (newEmail) => ({
    type: ACCOUNT_RESET_EMAIL_COMPLETE,
    payload: newEmail,
});

/**
 * An account's email was sent successfully.
 */
const resetEmailPending = () => ({
    type: ACCOUNT_RESET_EMAIL_PENDING,
});

/**
 * An account's password was sent successfully.
 */
const resetPasswordComplete = () => ({
    type: ACCOUNT_RESET_PASSWORD_COMPLETE,
});

/**
 * An error occurred while trying to reset an account's password.
 */
const resetPasswordError = () => ({
    type: ACCOUNT_RESET_PASSWORD_ERROR,
});

/**
 * An error occurred while trying to reset an account's password.
 */
const resetEmailError = (error) => ({
    type: ACCOUNT_RESET_EMAIL_ERROR,
    payload: error,
});

/**
 * Used when we need to request a new password for the account.
 */
const requestPasswordReset = () => ({
    type: ACCOUNT_REQUEST_PASSWORD_RESET,
});

/**
 * An error occurred while trying to reset an account's password.
 */
const logoutAccount = () => ({
    type: ACCOUNT_LOGOUT,
});

export default {
    failedAccountFetch,
    failedAccountSubscriptionsFetch,
    fetchingAccount,
    fetchingAccountSubscriptions,
    logoutAccount,
    receivedAccount,
    receivedAccountSubscriptions,
    receivedServiceAccessToken,
    requestPasswordReset,
    resetEmailComplete,
    resetEmailError,
    resetEmailPending,
    resetPasswordComplete,
    resetPasswordError,
    resettingPassword,
    revertEmailResetTimeout,
    revertPasswordResetTimeout,
    sendingPasswordResetEmail,
    sendPasswordResetEmailComplete,
    sendPasswordResetEmailError,
};