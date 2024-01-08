/* eslint-disable import/prefer-default-export */

// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

/**
 * Submits an API request to search for stock videos for a given category or query string
 *
 * @param {object}  searchParams
 * @param {string}  searchParams.searchQuery    Optional custom query string to search with
 * @param {number}  searchParams.categoryID     Optional number representing the ID of a category to retrieve videos from
 * @param {number}  [searchParams.page=1]       The page of results to retrieve for the search query and/or category
 * @param {number}  [searchParams.perPage=10]   The max number of videos to return for a single page
 */
export const submitStockVideoSearch = ({
    searchQuery,
    categoryID,
    page = 1,
    perPage = 10
}) => {
    const queryParams = {
        page,
        per_page: perPage,
    };

    if (searchQuery) queryParams.query = searchQuery;
    if (categoryID) queryParams.category_id = categoryID;

    const url = addQueryParametersToURL('stock-videos/search/', queryParams);

    return baseAPI.get(url);
};