// Vendor
import {
    useEffect,
    useMemo,
    useRef
} from 'react';
import {
    useDispatch
} from 'react-redux';
import {
    useLocation,
    useParams,
    matchPath
} from 'react-router-dom';

// Local
import {
    actions as checkoutActions
} from 'app/state/ducks/checkout/index.js';
import editorEventEmitter from 'editor/utils/editorEventEmitter.js';
import {
    appURLs,
    appRoutePaths
} from 'app/constants/urls.js';
import {
    goToInternalURL
} from 'app/utils/urls.js';
import {
    parseQueryParams
} from 'shared/utils/urls.js';
import EditPage from 'app/components/EditPage';
import {
    usePreviousLocation
} from 'app/providers/PreviousLocationProvider.js';
import EnsureLoggedInRedirect from 'app/components/EnsureLoggedInRedirect';

/**
 * Editor page connected with behavior specific to waymark.com (as opposed to an SDK-embedded version of the editor)
 */
function WaymarkEditPage() {
    const {
        pathname: currentPathname,
        search
    } = useLocation();
    const {
        userVideoGUID
    } = useParams();

    // By default, we'll return to the last known router location when closing the edit page
    const previousLocation = usePreviousLocation();

    // Grab a ref to the initial previous location when we first open the editor.
    // This is necessary because the true "previous location" can change when a blank
    // variant is saved for the first time, causing a redirect from ("/videos/:slug/edit" => "/account/your-videos/:guid/edit")
    const initialPreviousLocationRef = useRef(previousLocation);

    const previousPathname = initialPreviousLocationRef.current ? .pathname;
    const previousSearch = initialPreviousLocationRef.current ? .search;

    const previousVariantGroupSlug = useMemo(() => {
        // Check to see from which (if any) collection this variant was chosen. This allows
        // emails and other external sources to link to a variant and pass in the desired
        // origin collection, eg.:
        //     /videos/some-variant/edit?originCollection=tv-collection
        const queryParams = parseQueryParams(search);
        let variantGroupSlug = queryParams ? .originCollection || queryParams ? .variantGroup;

        // If there isn't a query param override then check to see if we can get a collection slug
        // from the previous URL
        if (!variantGroupSlug && previousPathname) {
            // If the previous page was the template browser, try to get a collection
            // slug from the previous URL's query params
            if (
                matchPath(previousPathname, {
                    path: appRoutePaths.templateBrowser,
                })
            ) {
                variantGroupSlug = parseQueryParams(previousSearch) ? .collection;
            } else {
                // If the previous page was a collection view page, try to
                // get a collection slug off of the URL's react-router params
                variantGroupSlug = matchPath(previousPathname, {
                    path: appRoutePaths.collectionView,
                }) ? .params ? .collectionSlug;
            }
        }

        return variantGroupSlug;
    }, [previousPathname, previousSearch, search]);

    useEffect(() => {
        /**
         * Navigates away from the editor to whatever the next appropriate URL is
         *
         * Triggered with `editorEventEmitter.emit('closeEditor', optionalNextURL)`
         *
         * @param {string} [nextURL] - Optional preferred next URL to navigate to. If not provided, we'll figure it out.
         */
        const onCloseEditor = (nextURL = null) => {
            if (nextURL) {
                // If a next URL was provided, go there
                goToInternalURL(nextURL);
            } else if (
                previousPathname &&
                // If the previous URL was an editor page, don't go there
                !matchPath(previousPathname, {
                    path: appRoutePaths.editVariant
                }) &&
                // If the previous URL was a checkout page, don't go there
                // (this indicates they opened the checkout page but then cancelled)
                !matchPath(previousPathname, {
                    path: appRoutePaths.checkout,
                }) &&
                // usePreviousLocation's context value is a ref, so changes to it do not cause a re-render, but the current
                // value of usePreviousLocation is always the same as the current path (see PreviousLocationProvider).
                // When the page is refreshed, a react-router-dom bug can cause a second re-render in which case
                // this component recognizes the updated value and tries to navigate to the same path.
                // https://github.com/remix-run/react-router/discussions/8025
                previousPathname !== currentPathname
            ) {
                // Go back to the previous page, taking care to restore its query params as well
                goToInternalURL(previousPathname, false, parseQueryParams(previousSearch));
            } else if (userVideoGUID) {
                // If we don't have a good previous URL to go to but this is a draft or purchased video, go to the user's video page
                goToInternalURL(appURLs.accountVideos);
            } else {
                // If we couldn't figure out the next best place to go, go to Waymark AI
                goToInternalURL(appURLs.ai);
            }
        };

        editorEventEmitter.on('closeEditor', onCloseEditor);

        return () => editorEventEmitter.off('closeEditor', onCloseEditor);
    }, [previousPathname, previousSearch, previousVariantGroupSlug, userVideoGUID, currentPathname]);

    const dispatch = useDispatch();

    useEffect(() => {
        /**
         * Navigates to the checkout page for a given EditorUserVideo so the user can purchase it
         * NOTE: this will discard any unsaved changes, so make sure to save the video before calling this
         *
         * @param {EditorUserVideo} userVideo
         */
        const openCheckoutForEditorVideo = async (userVideo) => {
            if (!userVideo || userVideo.isError) {
                // Ensure we have a valid video to check out with
                console.error('Could not find valid video to open in checkout');
                return;
            }
            if (userVideo.isPurchased) {
                // If the video is already purchased, just go to the account videos page
                goToInternalURL(appURLs.accountVideos);
                return;
            }

            const userVideoEditorURL = appURLs.editYourVideo(userVideo.guid);

            // Let's save the editor url for the user video so we can return to it if the user
            // chooses to exit the checkout flow early via the back button
            dispatch(checkoutActions.setPreviousURL(userVideoEditorURL));

            // Go to the checkout page with the guid for the user video we're purchasing
            const checkoutURL = appURLs.checkout(userVideo.guid);
            goToInternalURL(checkoutURL, true);
        };

        // Open checkout when the `onVideoCompleted` event is emitted by clicking the purchase button
        editorEventEmitter.on('videoCompleted', openCheckoutForEditorVideo);

        return () => editorEventEmitter.off('videoCompleted', openCheckoutForEditorVideo);
    }, [dispatch]);

    return <EditPage previousVariantGroupSlug = {
        previousVariantGroupSlug
    }
    />;
}

export default function WaymarkEditPageWithRedirect() {
    return ( <
        EnsureLoggedInRedirect >
        <
        WaymarkEditPage / >
        <
        /EnsureLoggedInRedirect>
    );
}