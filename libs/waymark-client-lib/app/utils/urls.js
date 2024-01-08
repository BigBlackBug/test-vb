// Local
import history from 'app/state/history.js';
import {
    parsePersistentQueryParamsForInternalURL
} from 'shared/utils/urls.js';

/**
 * Navigates to a url within the front-end app
 *
 * @param {string}  url             URL path to navigate to
 * @param {bool}    shouldReplace   Whether the new path should replace the previous path in the location history
 * @param {object}  queryParms      Object representing all query params to apply to the url
 */
export const goToInternalURL = (
    url,
    shouldReplace = false,
    queryParams = parsePersistentQueryParamsForInternalURL(),
) => {
    if (typeof url !== 'string') {
        if (typeof url === 'function') {
            console.error(
                'Provided a function rather than a string to goToInternalURL - this likely means the url you provided includes a dynamic slug or guid and must be called as a function to construct a url string',
            );
        } else {
            console.error(
                `Provided URL has invalid type ${typeof url} - double check that you are providing a valid url string`,
            );
        }
        return;
    }

    const searchParams = new URLSearchParams();

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            searchParams.set(key, value);
        }
    }

    const searchString = searchParams.toString();

    if (shouldReplace) {
        history.replace({
            pathname: url,
            search: searchString,
        });
    } else {
        history.push({
            pathname: url,
            search: searchString,
        });
    }
};