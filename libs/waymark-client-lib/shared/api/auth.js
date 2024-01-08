// Local
import baseAPI from 'shared/api/core/base.js';
import {
    parseQueryParams
} from 'shared/utils/urls.js';
import {
    queryParams
} from 'app/constants/urls.js';

/**
 * Create an account.
 *
 * @param {object} signupData
 * @param {string} signupData.name Name to associate with the new Account, LoginUser, and AccountUserProfile.
 * @param {string} signupData.email_address Email address to associate with the new Account, LoginUser, and AccountUserProfile.
 * @param {String} signupData.password Password
 * @param {String} signupData.companyName Company name to store on created account
 * @param {String} signupData.accountGroupInviteCode Unique invite code for AccountGroup that user should be added to
 */
export const createAccount = async ({
    name,
    emailAddress,
    password,
    companyName,
    accountGroupInviteCode,
}) => {
    const url = `accounts/signup/`;
    try {
        // Post everything to '/signup'.
        const response = await baseAPI.post(url, {
            name,
            email_address: emailAddress,
            password,
            company_name: companyName,
            account_group_invite_code: accountGroupInviteCode,
        });
        return response;
    } catch (error) {
        // Reformat the company_name field error to camelCase - ideally all fields should follow this convention,
        // but only converting this one for now to avoid introducing any regressions.
        if (error.fieldErrors) {
            error.fieldErrors.companyName = error.fieldErrors ? .company_name;
            delete error.fieldErrors ? .company_name;
        }
        throw error;
    }
};

/**
 * Create an account for an SDK  user.
 *
 * @param {string} sdkPartnerID AccountPartner SDK partner ID.
 * @param {string} signedJWT JSON web token signed with a secret key containing necessary info for creating an account.
 */
export const createSDKAccount = ({
        sdkPartnerID,
        signedJWT
    }) =>
    baseAPI.post(`accounts/create/`, {
        // FIXME: we may no longer need this partner ID due to the partner ID header.
        sdk_partner_id: sdkPartnerID,
        token: signedJWT,
    });

/**
 * Login to an account.
 *
 * @param {object} formData Form data submission.
 * @param {string} formData.email_address Email address to associated with the Account.
 * @param {String} formData.password Password associated with the Account.
 */
export const login = ({
    emailAddress,
    password
}) => {
    const url = `accounts/login/`;
    const requestData = {
        email_address: emailAddress,
        password,
    };

    const adminOverrideParam = parseQueryParams()[queryParams.adminOverrideAccountGUID];
    if (adminOverrideParam) {
        requestData[queryParams.adminOverrideAccountGUID] = adminOverrideParam;
    }

    // Post everything to '/login' and get the full response so we can access the response's metadata as well
    return baseAPI.post(url, requestData, {}, true);
};

/**
 * Login an SDK user.
 *
 * @param {string} sdkPartnerID AccountPartner SDK partner ID.
 * @param {string} signedJWT JSON web token signed with a secret key containing necessary info for creating an account.
 */
export const sdkLogin = ({
        sdkPartnerID,
        signedJWT
    }) =>
    baseAPI.post(`accounts/sdk-login/`, {
        // FIXME: we may no longer need this partner ID due to the partner ID header.
        sdk_partner_id: sdkPartnerID,
        token: signedJWT,
    });

/**
 * Logout of an account.
 */
export const logout = () => {
    const url = `accounts/logout/`;

    // Post everything to '/logout'.
    return baseAPI.post(url);
};

/**
 * Create and send a reset password email.
 *
 * @param {sting}   accountEmailAddress    Email address of account.
 */
export const sendPasswordRecoveryEmail = (accountEmailAddress) => {
    const url = `accounts/initiate-reset-password/`;

    return baseAPI.post(url, {
        account_email_address: accountEmailAddress
    });
};

/**
 * Reset an account's email.
 *
 * @param {string}   accountGUID    Selected account guid.
 * @param {string}   newEmail    The user's new raw password.
 */
export const resetEmail = (accountGUID, newEmail, password) => {
    const url = `accounts/reset-email/`;

    return baseAPI.patch(url, {
        account_guid: accountGUID,
        new_email: newEmail,
        password,
    });
};

/**
 * Reset an account's password.
 *
 * @param {string}   accountGUID    Selected account guid.
 * @param {string}   newPassword    The user's new raw password.
 */
export const resetPassword = (
    accountGUID,
    newPassword,
    shouldCheckCurrentPassword,
    // default to null for use cases where user does not have a current password.
    currentPassword = null,
) => {
    const url = `accounts/reset-password/`;

    return baseAPI.patch(url, {
        account_guid: accountGUID,
        password: newPassword,
        old_password: currentPassword,
        should_check_current_pass: shouldCheckCurrentPassword,
    });
};

/**
 * Update account information.
 *
 * @param {string}   accountGUID         Selected account guid.
 * @param {dict}     updatedAccountInfo  Object containing updated account info.
 */
export const updateAccount = (accountGUID, updatedAccountInfo) => {
    const url = `accounts/${accountGUID}/`;

    return baseAPI.patch(url, updatedAccountInfo);
};