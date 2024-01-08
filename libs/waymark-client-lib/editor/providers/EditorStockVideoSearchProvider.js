// Vendor
import {
    useContext,
    useEffect,
    useReducer,
    createContext
} from 'react';

// Local
import sharedPropTypes from 'shared/components/propTypes/index.js';

// App
import {
    useIsWindowMobile
} from 'app/hooks/windowBreakpoint.js';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import ShutterstockService from 'shared/services/ShutterstockService';

import {
    AssetSearchResponse,
    Video
} from '@libs/media-asset-management-ts';

const INITIAL_SEARCH_STATE = {
    searchQuery: null,
    categoryID: null,
    totalClipCount: 0,
    nextPageVideoCount: 0,
    pageCount: 1,
    videos: [],
    isLoading: false,
    hasError: false,
};

/**
 * Creates initial state object for reducer with variable maxItemsPerPage.
 *
 * @param {int} maxItemsPerPage: Maximum number of items to load or return at one time.
 */
const initializeSearchState = (maxItemsPerPage) => ({
    ...INITIAL_SEARCH_STATE,
    maxItemsPerPage,
});

const SEARCH_ACTIONS = {
    SUBMIT_NEW_SEARCH: 'SUBMIT_NEW_SEARCH',
    LOAD_NEXT_PAGE: 'LOAD_NEXT_PAGE',
    START_SEARCH: 'START_SEARCH',
    RECEIVED_SEARCH_RESULTS: 'RECEIVED_SEARCH_RESULTS',
    SEARCH_FAILED: 'SEARCH_FAILED',
    CLEAR_SEARCH: 'CLEAR_SEARCH',
};

/**
 * Takes raw video object returned from our Shutterstock API proxy search and formats
 * it to be cleanly used in our app
 *
 * @param {object}  rawVideo
 */
const formatRawSearchVideo = (rawVideo) => ({
    assetSource: rawVideo.source,
    assetSourceID: rawVideo.source_asset_id,
    searchID: rawVideo.search_id,
    aspect: rawVideo.aspect,
    aspectRatio: rawVideo.aspect_ratio,
    width: rawVideo.width,
    height: rawVideo.height,
    length: rawVideo.length,
    previewURL: rawVideo.preview_url,
    thumbnailURL: rawVideo.thumb_url,
    categories: rawVideo.categories,
    description: rawVideo.description,
    keywords: rawVideo.keywords,
});

const searchReducer = (state, action) => {
    switch (action.type) {
        case SEARCH_ACTIONS.SUBMIT_NEW_SEARCH:
            return {
                ...initializeSearchState(action.maxItemsPerPage),
                searchQuery: action.searchQuery || null,
                categoryID: action.categoryID || null,
            };
        case SEARCH_ACTIONS.LOAD_NEXT_PAGE:
            return {
                ...state,
                pageCount: state.pageCount + 1,
            };
        case SEARCH_ACTIONS.START_SEARCH:
            return {
                ...state,
                isLoading: true,
                hasError: false,
            };
        case SEARCH_ACTIONS.RECEIVED_SEARCH_RESULTS:
            {
                /** @type {AssetSearchResponse<Video>} */
                const searchResults = action.searchResults;

                const {
                    assets: videos,
                    total_count: totalCount
                } = searchResults;

                const newVideosList = state.videos.concat(videos);

                return {
                    ...state,
                    videos: newVideosList,
                    totalClipCount: totalCount,
                    nextPageVideoCount: Math.min(totalCount - newVideosList.length, state.maxItemsPerPage),
                    isLoading: false,
                };
            }
        case SEARCH_ACTIONS.SEARCH_FAILED:
            {
                return {
                    ...state,
                    isLoading: false,
                    hasError: true,
                };
            }
        case SEARCH_ACTIONS.CLEAR_SEARCH:
            return initializeSearchState(action.payload);
        default:
            return state;
    }
};

const StockVideoSearchContext = createContext();

/**
 * @typedef {object} StockVideoSearchContextValue
 *
 * @property {string} searchQuery
 * @property {number} categoryID
 * @property {number} totalClipCount
 * @property {number} nextPageVideoCount
 * @property {number} pageCount
 * @property {Video[]} videos
 * @property {boolean} isLoading
 * @property {boolean} hasError
 * @property {function} searchByQueryString
 * @property {function} selectCategory
 * @property {function} getNextPageForSearch
 * @property {function} clearSearch
 */

/**
 * @returns {StockVideoSearchContextValue}
 */
export const useStockVideoSearchContext = () => useContext(StockVideoSearchContext);

/**
 * Provider gives wrapped components access to stock video search context
 *
 * @param {node|node[]} children        Children that should be wrapped in provider
 */
export default function EditorStockVideoSearchProvider({
    children
}) {
    const isMobile = useIsWindowMobile();
    const maxItemsPerPage = isMobile ? 20 : 50;

    const [searchState, dispatchSearchState] = useReducer(
        searchReducer,
        initializeSearchState(maxItemsPerPage),
        initializeSearchState,
    );
    const {
        searchQuery,
        categoryID,
        isLoading,
        nextPageVideoCount,
        pageCount
    } = searchState;

    const searchByQueryString = (newSearchQueryString) => {
        if (!newSearchQueryString || newSearchQueryString === searchQuery || isLoading) {
            return;
        }

        dispatchSearchState({
            type: SEARCH_ACTIONS.SUBMIT_NEW_SEARCH,
            searchQuery: newSearchQueryString,
            maxItemsPerPage,
        });
    };

    const selectCategory = (newCategoryID) => {
        if (!newCategoryID || isLoading) {
            return;
        }

        dispatchSearchState({
            type: SEARCH_ACTIONS.SUBMIT_NEW_SEARCH,
            categoryID: newCategoryID,
            maxItemsPerPage,
        });
    };

    useEffect(() => {
        // Kick off a stock video search when the search query, category ID, and/or page number changes

        // Don't do anything if we don't have any search query or category to use
        if (!searchQuery && !categoryID) {
            return;
        }

        (async () => {
            // Mark that we are kicking off a search and waiting for it to load
            dispatchSearchState({
                type: SEARCH_ACTIONS.START_SEARCH
            });

            try {
                GoogleAnalyticsService.trackEvent('searched_categories', {
                    eventCategory: 'stock_video_asset',
                    eventLabel: searchQuery,
                });

                const searchParameters = {
                    query: searchQuery || '',
                    page: pageCount,
                    per_page: maxItemsPerPage,
                };

                if (categoryID) {
                    searchParameters.category = categoryID;
                }

                const searchResults = await ShutterstockService.searchVideos(searchParameters);

                // If the search succeeded, update our state with the received results
                dispatchSearchState({
                    type: SEARCH_ACTIONS.RECEIVED_SEARCH_RESULTS,
                    searchResults,
                });
            } catch (error) {
                console.error(error);

                // Mark that the search failed so we can show an error message
                dispatchSearchState({
                    type: SEARCH_ACTIONS.SEARCH_FAILED,
                });
            }
        })();
    }, [searchQuery, categoryID, pageCount, maxItemsPerPage]);

    // Kicks off a request to get the next page of videos for the current search terms
    const getNextPageForSearch = async () => {
        if (
            // Don't do anything if there's no more videos to load
            nextPageVideoCount <= 0 ||
            // Don't do anything if we're currently already loading videos
            isLoading
        ) {
            return;
        }

        dispatchSearchState({
            type: SEARCH_ACTIONS.LOAD_NEXT_PAGE,
        });
    };

    // Clears the current search
    const clearSearch = () => {
        dispatchSearchState({
            type: SEARCH_ACTIONS.CLEAR_SEARCH,
            payload: maxItemsPerPage,
        });
    };

    return ( <
        StockVideoSearchContext.Provider value = {
            {
                ...searchState,
                searchByQueryString,
                selectCategory,
                getNextPageForSearch,
                clearSearch,
            }
        } >
        {
            children
        } <
        /StockVideoSearchContext.Provider>
    );
}

EditorStockVideoSearchProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};