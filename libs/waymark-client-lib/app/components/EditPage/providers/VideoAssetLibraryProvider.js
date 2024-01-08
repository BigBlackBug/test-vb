// Vendor
import _ from 'lodash';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    useRef,
    useMemo,
} from 'react';
import {
    useSelector
} from 'react-redux';

// Shared
import {
    fetchVideoAssetLibraries
} from 'shared/api/index.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';
import {
    orderCollectionByValuesList
} from 'shared/utils/collections.js';
import {
    getBusinessRefetchQuery
} from 'shared/api/graphql/businesses/queries';

// App
import * as selectors from 'app/state/selectors/index.js';
import stockVideoAssetUploader from 'app/services/StockVideoAssetUploader';
import {
    useAccountVideoAssets,
    useBusinessVideoAssets,
    useCreateAccountLibraryVideoMutation,
    useCreateBusinessLibraryVideoMutation,
    videoLibraryQueries,
} from 'app/hooks/videoLibraries.js';

import {
    useEditorBusinessDetailContext
} from './BusinessDetailProvider.js';

const EditorVideoAssetLibraryContext = createContext();

export const useEditorVideoAssetLibraryContext = () => useContext(EditorVideoAssetLibraryContext);

/**
 * Provides editor with:
 *  - Functionality to load and format the user's video assets when they're needed
 *  - Access to the user's loaded video asset libraries and account video assets
 *  - Functionality to upload a video asset
 */
export default function EditorVideoAssetLibraryProvider({
    children
}) {
    const {
        accountGUID,
        videoAssetLibrarySlugs
    } = useSelector((state) => ({
        accountGUID: selectors.getAccountGUID(state),
        videoAssetLibrarySlugs: selectors.getVideoAssetLibrarySlugs(state),
    }));

    // Accounts
    const [accountGroupLibraries, setAccountGroupLibraries] = useState([]);
    const [shouldFetchAccountAssets, setShouldFetchAccountAssets] = useState(false);
    // We don't want to fetch assets before their relevant panels have been opened,
    // so we don't supply the account GUID until it has
    const accountVideoAssets = useAccountVideoAssets(shouldFetchAccountAssets ? accountGUID : null);

    // Businesses
    const {
        appliedBusinessGUID,
        editingBusinessGUID
    } = useEditorBusinessDetailContext();

    // If a business is being edited we should prioritize fetching assets for that, otherwise
    // we'll fetch assets for the business currently applied for personalization
    // TODO: ideally we would be able to fetch video assets separately between the editing and applied businesses,
    // but this `requestedBusinessGUID` concept is a little too entangled in the way things are currently structured
    // to tackle it right now. See the way that font and color libraries are structured for how this
    // might be refactored in the future.
    const requestedBusinessGUID = editingBusinessGUID || appliedBusinessGUID;

    // No need to fetch video assets until one of the footage panels has been opened
    const [shouldFetchBusinessAssets, setShouldFetchBusinessAssets] = useState(false);

    // Load video assets for the current business
    const businessVideoAssets = useBusinessVideoAssets(
        shouldFetchBusinessAssets ? requestedBusinessGUID : null,
    );

    // User asset management
    const [uploadingVideoAssets, setUploadingVideoAssets] = useState([]);

    // Account group libraries
    // BUSINESS PROFILES TODO: Convert to GraphQL

    // Use a ref to track which account group libraries are currently being fetched
    // because it's purely used for keeping track of other async state changes and
    // should not trigger re-renders
    const fetchingAccountGroupLibrarySlugsRef = useRef([]);

    const loadAccountGroupLibraries = useCallback(async () => {
        // Get a filtered list of all slugs for libraries that have not been fetched and are not in the process of being fetched
        const unfetchedLibrarySlugs = videoAssetLibrarySlugs.filter((slug) => {
            // If this slug is already in the process of being fetched, filter it out
            if (fetchingAccountGroupLibrarySlugsRef.current.includes(slug)) return false;

            // If this slug has already been fetched, filter it out
            if (accountGroupLibraries.find((library) => library.slug === slug)) return false;

            return true;
        });

        // Return early if we don't have any libraries to fetch
        if (_.isEmpty(unfetchedLibrarySlugs)) return;

        // Update our list of slugs to indicate we're now fetching all of the unfetched slugs we found
        fetchingAccountGroupLibrarySlugsRef.current =
            fetchingAccountGroupLibrarySlugsRef.current.concat(unfetchedLibrarySlugs);

        try {
            // Fetch all of our unfetched slugs
            const fetchedLibraries = await fetchVideoAssetLibraries(unfetchedLibrarySlugs);

            setAccountGroupLibraries((currentAccountGroupLibraries) => {
                // Format all of our libraries before storing them
                const formattedFetchedLibraries = fetchedLibraries.map((fetchedLibrary) => ({
                    slug: fetchedLibrary.slug,
                    displayName: fetchedLibrary.display_name,
                    videoAssets: fetchedLibrary.video_assets,
                }));

                // Merge any libraries that have already been fetched with the new ones that we just fetched
                const combinedLibraries = _.unionBy(
                    currentAccountGroupLibraries,
                    formattedFetchedLibraries,
                    'slug',
                );

                // Sort our combined libraries to respect the order that all of our array of library slugs is in
                const combinedLibrariesSortedBySlug = orderCollectionByValuesList(
                    combinedLibraries,
                    videoAssetLibrarySlugs,
                    'slug',
                );

                return combinedLibrariesSortedBySlug;
            });
        } catch (error) {
            console.error('Failed to load video asset libraries:', error);
        }

        // Remove all slugs that we just fetched from the list of currently fetching slugs
        fetchingAccountGroupLibrarySlugsRef.current =
            fetchingAccountGroupLibrarySlugsRef.current.filter(
                (slug) => !unfetchedLibrarySlugs.includes(slug),
            );
    }, [videoAssetLibrarySlugs, accountGroupLibraries]);

    // Panel setup methods
    /**
     * Panel setup method for the EditorVideoLibrary. Kicks off the following processes:
     * - Load account and selected business footage libraries (stock included)
     * - Load account group footage libraries
     */
    const onOpenTemplateFootagePanel = useCallback(() => {
        setShouldFetchAccountAssets(true);
        setShouldFetchBusinessAssets(true);

        loadAccountGroupLibraries();
    }, [loadAccountGroupLibraries]);

    /**
     * Panel setup method for the BusinessProfileFootagePanel
     * - Load footage for the current business profile
     */
    const onOpenBusinessProfileFootagePanel = useCallback(() => {
        setShouldFetchBusinessAssets(true);
    }, []);

    // Stock asset managment
    const addStockVideoToLibrary = useCallback(
        (stockVideoSearchResultData) =>
        stockVideoAssetUploader.createStockVideoAsset({
            stockVideoData: stockVideoSearchResultData,
            accountGUID: requestedBusinessGUID ? null : accountGUID,
            businessGUID: requestedBusinessGUID,
        }), [accountGUID, requestedBusinessGUID],
    );

    const [uploadingStockAssetIds, setUploadingStockAssetIds] = useState([]);

    useEffect(() => {
        const unsubscribeUploadingIdsChanged =
            stockVideoAssetUploader.subscribeUploadingIdsChanged(setUploadingStockAssetIds);

        return () => unsubscribeUploadingIdsChanged();
    }, []);

    /**
     * Construct a list of stock video asset source IDs for the current library. This is either the currently
     * selected business, in business profile or main panel, or the account.
     */
    const getCurrentLibraryStockAssetIDs = useCallback(() => {
        if (requestedBusinessGUID) {
            return businessVideoAssets ? .stock.map(({
                stockAsset
            }) => stockAsset.sourceAssetId);
        }

        return accountVideoAssets ? .stock.map(({
            stockAsset
        }) => stockAsset.sourceAssetId);
    }, [requestedBusinessGUID, businessVideoAssets, accountVideoAssets]);

    // Track upload errors across consumers
    const [uploadErrorMessage, setUploadErrorMessage] = useState('');

    // Construct a query object to refresh the current business's total video count that
    // can be used in conjunction with mutations that remove/restore footage
    const refreshBusinessVideoCountQuery = useMemo(
        () => getBusinessRefetchQuery(requestedBusinessGUID, ['totalVideoCount']), [requestedBusinessGUID],
    );

    // Destructure mutations
    const [createAccountLibraryVideo] = useCreateAccountLibraryVideoMutation();
    const [createBusinessLibraryVideo] = useCreateBusinessLibraryVideoMutation();

    /**
     * Creates a VideoAssetLibraryVideo record for the provided video asset data.
     * Asset will be associated with a business or account, depending on which guids are present.
     *
     * @param {Object} videoAssetData
     * @param {string} videoAssetData.uploadKey    Source key provided from VideoProcessingService
     * @param {int} videoAssetData.width    Width of processed video
     * @param {int} videoAssetData.height    Height of processed video
     * @param {int} videoAssetData.length    Duration of processed video
     */
    const createVideoAsset = async (videoAssetData) => {
        if (requestedBusinessGUID) {
            await createBusinessLibraryVideo({
                variables: {
                    input: {
                        ...videoAssetData,
                        businessGuid: requestedBusinessGUID,
                    },
                },
                refetchQueries: [{
                        query: videoLibraryQueries.business,
                        variables: {
                            businessGUID: requestedBusinessGUID,
                        },
                    },
                    refreshBusinessVideoCountQuery,
                ],
            });
        } else {
            await createAccountLibraryVideo({
                variables: {
                    input: {
                        ...videoAssetData,
                        accountGuid: accountGUID,
                    },
                },
                refetchQueries: [{
                    query: videoLibraryQueries.account,
                    variables: {
                        accountGUID,
                    },
                }, ],
            });
        }
    };

    /**
     * Parse a configuration and return a list all present stock video asset VPS keys.
     *
     * @param {obj} configuration: UserVideo configuration.
     */
    const getInUseStockVideoAssetKeys = useCallback(
        (configuration) => {
            const stockVideoLibraryVPSKeys = [
                ...(accountVideoAssets ? .stock || []),
                ...(businessVideoAssets ? .stock || []),
            ].map(({
                stockAsset
            }) => stockAsset.vpsKey);

            const vpsKeysUsedInConfiguration = [];

            Object.values(configuration).forEach((field) => {
                // Skip any non-video configuration fields
                if (field ? .content ? .type !== 'video') return;

                const videoFieldVPSKey = field.content.location ? .sourceVideo;

                if (videoFieldVPSKey && stockVideoLibraryVPSKeys.includes(videoFieldVPSKey)) {
                    vpsKeysUsedInConfiguration.push(videoFieldVPSKey);
                }
            });

            return vpsKeysUsedInConfiguration;
        }, [accountVideoAssets ? .stock, businessVideoAssets ? .stock],
    );

    return ( <
        EditorVideoAssetLibraryContext.Provider
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        value = {
            {
                // video assets
                accountVideoAssets,
                businessVideoAssets,
                staticVideoLibraries: accountGroupLibraries,
                uploadingStockAssetIds,
                // asset management
                addStockVideoToLibrary,
                createVideoAsset,
                refreshBusinessVideoCountQuery,
                getCurrentLibraryStockAssetIDs,
                uploadingVideoAssets,
                setUploadingVideoAssets,
                // util methods
                getInUseStockVideoAssetKeys,
                setUploadErrorMessage,
                uploadErrorMessage,
                // panel setup methods
                onOpenBusinessProfileFootagePanel,
                onOpenTemplateFootagePanel,
            }
        } >
        {
            children
        } <
        /EditorVideoAssetLibraryContext.Provider>
    );
}

EditorVideoAssetLibraryProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};