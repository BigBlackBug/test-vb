/* eslint-disable */
// TODO: Actually fix these ported methods. This is being ignored strictly
//       for the sake of expediency and a need to take on some technical
//       debt for Palm.

// Vendor
import _ from 'lodash';
import axios from 'axios';

// Local
import {
    persistentQueryParams
} from 'app/constants/urls.js';
import settings from 'shared/utils/settings.js';

/**
 * Intended to be a direct mapping of python's urlib.urlencode
 * @param  {dict} obj     A dictionary of parameters
 * @param  {[type]} prefix [description]
 * @return {string}        A querystring (sans '?') representing key/value pairs from the given dictionary
 */
export function urlencode(obj, prefix) {
    const str = [];
    for (const p in obj) {
        const k = prefix ? `${prefix}[${p}]` : p;
        const v = obj[p];
        str.push(
            typeof v === 'object' ? serialize(v, k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
        );
    }

    return str.join('&');
}

/**
 * Takes a URL and strips all query params from it
 * @param {string} [url] URL to remove query params from
 */
export const getURLWithoutQueryParams = (url = '') => url.split('?')[0];

/**
 * Return an object with key-value pairs corresponding to the query parameters from
 * the provided url string, or the window's current location if no url string is provided.
 * @param  {string} [url] URL to parse for query params
 * @return  Object of query params
 */
export function parseQueryParams(url = '') {
    let queryString;

    // We'll prefer to get our query string from the url provided, but fall back to the current window location if not provided
    if (url) {
        queryString = new URL(url, window.location).search;
    } else {
        queryString = window.location.search;
    }

    // Create a URLSearchParams object to parse the query string
    const searchParams = new URLSearchParams(queryString);

    // Generate an object with all of the parsed query params as properties
    return _.fromPairs(Array.from(searchParams.entries()));
}

/**
 * Returns an object of query params parsed from a url, only including ones that are allowed
 * to persist between pages by being included in the `persistentQueryParams` constants array
 * @param {string}  [url]
 */
export function parsePersistentQueryParamsForInternalURL(url) {
    const queryParams = parseQueryParams(url);

    return _.pick(queryParams, persistentQueryParams);
}

/**
 * Takes a URL string and returns an updated URL string with the given query parameters added to it.
 *
 * @param {string} url - The URL to add the query parameters to.
 * @param {object} newParameters - An object of query parameters to add to the URL.
 * @param {boolean} shouldOverrideExisting - If true, any existing query parameters on the URL with the same name as a new parameter will be overwritten.
 */
export function addQueryParametersToURL(url, newParameters, shouldOverrideExisting = true) {
    if (!url) return url;

    const [baseURL, existingSearchString] = url.split('?');

    const searchParams = new URLSearchParams(existingSearchString);

    for (const key in newParameters) {
        const paramValue = newParameters[key];

        if (shouldOverrideExisting) {
            searchParams.delete(key);
        }

        if (Array.isArray(paramValue)) {
            paramValue.forEach((value) => {
                searchParams.append(key, value);
            });
        } else {
            searchParams.append(key, newParameters[key]);
        }
    }

    const newSearchString = searchParams.toString();

    return `${baseURL}${newSearchString ? `?${newSearchString}` : ''}`;
}

/**
 * Takes a search string (ie, "?foo=bar") and appends any query parameters from the current
 * URL which should be persisted across pages.
 *
 * @param {string} searchString
 */
export function addPersistedQueryParamsToSearchString(searchString = '') {
    const searchParams = new URLSearchParams(searchString);

    // Get the existing query parameters from the location URL, excluding any that
    // we don't want to persist between pages
    const queryParams = parsePersistentQueryParamsForInternalURL();

    for (const key in queryParams) {
        if (!searchParams.has(key)) {
            searchParams.set(key, queryParams[key]);
        }
    }

    // Retain whatever the original search string started with
    const didSearchStringStartWithQuestionMark = searchString.startsWith('?');

    return `${didSearchStringStartWithQuestionMark ? '?' : ''}${searchParams.toString()}`;
}

/**
 * Adds the query parameters from the current window.location URL to
 * a URL, preserving any params on the URL but overwriting any duplicates
 * with those from the location URL, but only if the URL has the same
 * root domain as the location URL.
 * @param {String} url The URL to add the query parameters to.
 * @return {String} The URL with all query parameters added.
 */
export function addLocationSearchToURL(url) {
    const parsedURL = new URL(url, window.location);

    // The link needs to share at least the root domain of the current URL, or we have to be serving from
    // localhost (to aid developers) for the query params to be added.
    if (!window.location.hostname.endsWith(parsedURL.hostname) &&
        window.location.hostname !== 'localhost'
    ) {
        return url;
    }

    // Get the existing query parameters from the location URL, excluding any that
    // we don't want to persist between pages
    const queryParams = parsePersistentQueryParamsForInternalURL();
    // Add them to the URL, overwriting any duplicates.
    return addQueryParametersToURL(url, queryParams, true);
}

/**
 * Parses a url string into an object of relevant parts to the url
 * Returns object of matching parts
 *   fullMatch   (i.e.  http://www.waymark.com/)
 *   protocol   (i.e. https://)
 *   subDomain   (i.e. www, blog)
 *   domainName   (i.e. waymark, social)
 *   topLevelDomain   (i.e. com, pr)
 *   path   (i.e. /signup/preview)
 *   queryParameters   (i.e. ?foo=bar)
 *
 * @param  {String}  url The url to parse
 * @return {Object}      The matched object of url parts
 */
export function getURLParts(url) {
    const urlRegex =
        /^(https?:\/\/)?(?:([\da-z\-]+)?\.)?(?:([\da-z\-]+)\.)([a-z\.]{2,})(\/[\/\w \.-]*)*(\?[\S]*)*\/?$/;
    const urlParts = urlRegex.exec(url) || [];

    return {
        fullMatch: urlParts[0],
        protocol: urlParts[1],
        subDomain: urlParts[2],
        domainName: urlParts[3],
        topLevelDomain: urlParts[4],
        path: urlParts[5],
        queryParameters: urlParts[6],
    };
}

/**
 * Utility method that returns the current url without query parameters for the names
 * passed in to the method. E.g.: if we are currently on
 *    http://www.go.com?hey=ho&me=you&foo=bar
 *    removeQueryParamsFromURL(http://www.go.com, 'hey', 'me')  // => http://www.go.com?foo=bar
 *
 * @param  {string} url
 *         URL that will be parsed for query params and then returned with the modified params.
 *         Either an absolute or relatvie URL structure, whichever the caller would like returned
 * @param  {...string} parameterNames
 *         One or multiple provided names of queryParameters to remove.
 * @return {string} The url sans those query parameters.
 */
export const removeQueryParamsFromURL = (url, ...parameterNames) => {
    const parsedURL = new URL(url, window.location);

    parameterNames.forEach((name) => {
        parsedURL.searchParams.delete(name);
    });

    return parsedURL.toString();
};
if (typeof window !== 'undefined') {
    window.removeQueryParamsFromURL = removeQueryParamsFromURL;
}

const VALID_UTM_PARAMETERS = {
    utm_campaign: true,
    utm_content: true,
    utm_medium: true,
    utm_source: true,
    utm_term: true,
};

/**
 * Get the imgix url for an image given a uri path
 * @param {string} uri                                    The image's file path inside bucket w/o leading slash, i.e. 'app/payments/test.jpg'
 * @param {object} [imgixParams]                          Additional imgix params to add as queries to the imgix url
 * @param {string} [bucketDomain=settings.IMGIX_DOMAIN]   S3 bucket domain that image is in - defaults to images-web
 *                                                        Domains can be accessed from the runtime settings in shared/utils/settings.js
 */
export function getImgixUrl(uri, imgixParams, bucketDomain = settings.IMGIX_DOMAIN) {
    // Return constructed url with query params
    return addQueryParametersToURL(`https://${bucketDomain}/${uri}`, {
        ...imgixParams,
        // Add "auto=compress,format" to all images
        auto: 'compress,format',
    });
}

// Regular expression borrowed from recurly.js
const EMAIL_REGEX =
    /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;

/**
 * Tests if an email address is valid or not.
 * @param {string} email - The email address to test.
 */
export const isValidEmail = (email) => EMAIL_REGEX.test(email);

// Matches strings starting with http:// or https://
const URL_PROTOCOL_REGEX = /^https?:\/\//;

/**
 * Is the given string a valid URL?
 * @param  {string}  string The string to evaluate
 * @return {{ isValid: boolean, url: URL | null}} An object with whether the string is a valid URL and the the parsed URL object if it was valid
 */
export function isValidURL(string) {
    if (!string) {
        return {
            isValid: false,
            url: null
        };
    }

    const urlWithProtocol = URL_PROTOCOL_REGEX.test(string) ? string : `http://${string}`;

    try {
        const url = new URL(urlWithProtocol);

        // Make sure the hostname includes a domain ending
        const dotIndex = url.hostname.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex >= url.hostname.length - 2) {
            return {
                isValid: false,
                url: null
            };
        }

        return {
            isValid: true,
            url,
        };
    } catch (e) {
        return {
            isValid: false,
            url: null,
        };
    }
}

/**
 * Returns whether the given url string is to an external url
 * @param {string} urlString The url string to evaluate
 * @return {bool}            True if the url is external
 */
export const isURLExternal = (urlString) => {
    const urlObject = new URL(
        urlString,
        // Base location that relative url paths will be based off of - if the given url has
        // its own external origin, this will be ignored
        window.location,
    );

    // If the url object's origin doesn't match our window origin, it's an external url
    return urlObject.origin !== window.location.origin;
};

/**
 * Performs a hard load of a url external to the app, ie a CMS page
 *
 * @param {string} url            URL to navigate to
 * @param {object} queryParams    Object representing all query params to apply to the url
 */
export const goToExternalURL = (url, queryParams) => {
    if (typeof url !== 'string') {
        console.error(
            `Provided URL has invalid type ${typeof url} - double check that you are providing a valid url string`,
        );
        return;
    }

    const isExternalDomain = isURLExternal(url);

    if (queryParams || !isExternalDomain) {
        // If query params were provided or the url is still at a waymark domain and should therefore retain query params,
        // make sure we add them to the new location url we navigate to
        window.location.href = addQueryParametersToURL(url, queryParams || parseQueryParams());
    } else {
        window.location.href = url;
    }
};

/**
 * Makes a HEAD request for a given URL and returns the response.
 *
 * @param {string}      - Web or asset URL.
 */
export const getHeadResponse = async (url) => {
    let response;

    await axios
        .head(url)
        .then((headResponse) => {
            response = headResponse;
        })
        .catch((error) => {
            response = error.response;
        });

    return response;
};

/**
 * Remove URL protocol and query parameters.
 *
 * @param {string} url - URL to parse
 * @returns {string}
 */
export const getURLPathAndDomain = (url = '') => {
    const parsedURL = new URL(url);
    return parsedURL.hostname + parsedURL.pathname;
};