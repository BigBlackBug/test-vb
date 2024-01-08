// Vendor
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URI = '/api/v3/';

export const extractErrorMessageFromFailure = (
    response,
    unknownErrorMessage = 'An unknown error occurred.',
) => {
    let errorMessage = '';
    let fieldErrors = {};
    let isError = true;

    if (response.data) {
        const {
            meta
        } = response.data;
        if (meta) {
            // This is an HTTP response with a data / meta section containing the message

            // Check to see if the server has indicated that there is an authentication action to
            // invoke.
            if (meta.reason === 'sso_login_failed') {
                // The API call failed SSO authentication and need to reload the page to refresh the
                // login credentials.
                window.location.reload();
                return null;
            }

            errorMessage = meta.error_message || meta.message;
            fieldErrors = meta.field_errors;
            isError = meta.is_error;
        }
    } else if (response.stack) {
        // This is an exception with a stack trace
        errorMessage = `${response.stack}`;
        errorMessage = errorMessage || unknownErrorMessage;
        console.warn(errorMessage);
    }

    return {
        errorMessage,
        fieldErrors,
        isError,
        statusCode: response.status,
    };
};

export const getCSRFHeader = () => {
    const csrfToken = Cookies.get('csrftoken');
    const csrfHeader = {
        'X-CSRFToken': csrfToken,
    };

    return csrfHeader;
};

/**
 * The base HTTP method definitions for our API requests. Front end API implementers
 * are not intended to be required to use these, but unless the request has complicated
 * and/or unique handling requirements, using these will likely be more efficient than
 * starting from scratch.
 */
const baseAPI = {};
baseAPI.get = (uri, params = {}, shouldReturnFullResponse = false) =>
    new Promise((resolve, reject) =>
        axios
        .get(API_BASE_URI + uri, {
            params,
        })
        .then((response) => resolve(shouldReturnFullResponse ? response : response.data.data))
        .catch((error) => reject(extractErrorMessageFromFailure(error.response))),
    );

baseAPI.patch = (uri, data = {}, shouldReturnFullResponse = false) =>
    new Promise((resolve, reject) =>
        axios
        .patch(API_BASE_URI + uri, data, {
            headers: getCSRFHeader()
        })
        .then((response) => resolve(shouldReturnFullResponse ? response : response.data.data))
        .catch((error) => reject(extractErrorMessageFromFailure(error.response))),
    );

baseAPI.post = (uri, data = {}, config = {}, shouldReturnFullResponse = false) => {
    const defaultedConfig = Object.assign(config, {
        headers: getCSRFHeader()
    });
    return new Promise((resolve, reject) =>
        axios
        .post(API_BASE_URI + uri, data, defaultedConfig)
        .then((response) => resolve(shouldReturnFullResponse ? response : response.data.data))
        .catch((error) => reject(extractErrorMessageFromFailure(error.response))),
    );
};

baseAPI.put = (uri, data = {}, shouldReturnFullResponse = false) =>
    new Promise((resolve, reject) =>
        axios
        .put(API_BASE_URI + uri, data, {
            headers: getCSRFHeader()
        })
        .then((response) => resolve(shouldReturnFullResponse ? response : response.data.data))
        .catch((error) => reject(extractErrorMessageFromFailure(error.response))),
    );

baseAPI.delete = (uri, data = {}, shouldReturnFullResponse = false) =>
    new Promise((resolve, reject) =>
        axios
        .delete(API_BASE_URI + uri, {
            data,
            headers: getCSRFHeader()
        })
        .then((response) => resolve(shouldReturnFullResponse ? response : response.data.data))
        .catch((error) => reject(extractErrorMessageFromFailure(error.response))),
    );

export default baseAPI;