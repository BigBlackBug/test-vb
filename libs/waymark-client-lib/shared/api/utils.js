// Local
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

/**
 * Helper for formatting businessGUID in the query params of a variant request.
 * @param  {String} url
 * @param  {String} businessGUID
 */
/* eslint-disable-next-line import/prefer-default-export */
export const addBusinessToURL = (url, businessGUID) => {
    if (businessGUID) {
        return addQueryParametersToURL(url, {
            selected_business_guid: businessGUID
        });
    }

    return url;
};