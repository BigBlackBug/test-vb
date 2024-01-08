// Vendor
import _ from 'lodash';

// Local
import {
    PromiseCache
} from 'app/objects.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchCollection,
    fetchCollections,
    fetchCollectionView
} from 'shared/api/index.js';
import collectionActions from './actions.js';

// We cache the promises returned by the `fetchCollection` and `fetchCollectionView` API calls here, which
// we'll use to ensure that any call to the `loadCollection` and `loadCollectionView` operations that occurs
// while a request for the same slug or guid is already outstanding can be returned
// the appropriate promise for that collection or collection view request.
const pendingRequests = new PromiseCache();
const pendingCollectionViewRequests = new PromiseCache();

/**
 * Fetch the collection based on the slug provided, if not already loaded into
 * the store state.
 *
 * @param  {String} slug Collection slug
 */
const loadCollection = (slug) => async (dispatch, getState) => {
    const storeState = getState();
    const loadedCollection = selectors.getCollectionBySlug(storeState, slug);

    if (loadedCollection) {
        // If we already have the collection in our state, let's return it.
        return loadedCollection;
    }

    if (pendingRequests.get(slug)) {
        // If we have a request for this slug that's still waiting to finish,
        // return the promise.
        return pendingRequests.get(slug);
    }
    // If we need to fetch this collection, let's get to it!
    await dispatch(collectionActions.fetchingCollection(slug));

    try {
        const fetchInProgress = fetchCollection(slug);
        // Store the promise in the cache in case we need it later.
        pendingRequests.set(slug, fetchInProgress);

        // Wait for it to come back from the API.
        const collectionResponse = await fetchInProgress;

        // The python API will sometimes return an array rather than a single collection object,
        // so let's dynamically determine how to extract the collection from the response
        const collection = Array.isArray(collectionResponse) ?
            collectionResponse[0] :
            collectionResponse;

        // The request completed, so let's null out the cache.
        pendingRequests.clear(slug);

        // Save the new collection in the state.
        await dispatch(collectionActions.receivedCollection(collection));

        return collection;
    } catch (error) {
        // The request completed (failed), so let's null out the cache.
        pendingRequests.clear(slug);

        // Let the state know we're no longer loading due to an error.
        await dispatch(collectionActions.failedCollectionFetch(error, slug));

        return error;
    }
};

/**
 * Fetch a list of collections based on the slugs provided, if not already loaded into
 * the store state.
 *
 * @param  {String} slug Collection slug
 */
const loadCollections = (slugs) => async (dispatch, getState) => {
    if (_.isEmpty(slugs)) {
        return [];
    }

    let storeState = getState();

    // Collections that have already been loaded.
    const loadedCollections = [];

    // Collections that we're already loading via an API call.
    const loadingCollectionPromises = [];
    const loadingCollectionSlugs = [];

    // Collections that aren't currently loaded or being loaded.
    const collectionSlugsToLoad = [];
    let apiLoadedCollections = [];

    // Group the collections into loaded, loading, and to be loaded.
    slugs.forEach((slug) => {
        const loadedCollection = selectors.getCollectionBySlug(storeState, slug);
        if (loadedCollection) {
            // This collection is already loaded so we'll hang on to it for now.
            loadedCollections.push(loadedCollection);
        } else {
            // Are we trying to load it?
            const loadingPromise = pendingRequests.get(slug);
            if (loadingPromise) {
                // It's being loaded so save the promise for awaiting with the ones we need to load.
                loadingCollectionPromises.push(loadingPromise);
                loadingCollectionSlugs.push(slug);
            } else {
                // This one needs to be loaded via an API call.
                collectionSlugsToLoad.push(slug);
            }
        }
    });

    // Check to see if we can return without creating a new API call.
    if (_.isEmpty(collectionSlugsToLoad)) {
        // Nothing to make an API call for.
        if (_.isEmpty(loadingCollectionPromises)) {
            // Nothing to load at all; just return the already loaded collections.
            return loadedCollections;
        }

        // We're still waiting for some collections to load from the API. Wait on the currently loading
        // collections and return the list of collections when done.
        await Promise.all(loadingCollectionPromises);

        storeState = getState();
        // Get the newly-loaded collections and add them to the previously loaded collections.
        return loadedCollections.concat(selectors.getVariantGroupsBySlugs(loadingCollectionSlugs));
    }

    // For collections not being loaded:
    //     1) Make a call to the API to load them.
    //     2) Make a promise that resolves with the individual collection when the list
    //        API call finishes, and put that in the promise cache for other potential
    //        requests to know about.

    // Tell the state that we're loading these collections.
    await Promise.all(
        collectionSlugsToLoad.map((slug) => dispatch(collectionActions.fetchingCollection(slug))),
    );

    // Call the API to retrieve the list of collections.
    const fetchingCollections = fetchCollections(collectionSlugsToLoad);

    // Each of these collections should have an entry in the Promise cache that follows
    // the contract of individually loaded collections as in `loadCollection` above. This
    // promise waits for the list call to resolve, then resolves itself with its own
    // collection as the resolution value.
    collectionSlugsToLoad.forEach((slug) =>
        pendingRequests.set(slug, async () => {
            const collections = await fetchingCollections;
            return collections.find((collection) => collection.slug === slug);
        }),
    );

    try {
        // Wait for the list API promise to resolve. We're not doing this in conjunction
        // with the other pending requests because we want to handle any errors specific
        // to the API request.
        apiLoadedCollections = await fetchingCollections;

        // The request completed, so let's null out the cache for each collection being loaded.
        collectionSlugsToLoad.forEach((slug) => pendingRequests.clear(slug));

        // Save each of the newly-loaded collections in the state.
        apiLoadedCollections.forEach((collection) =>
            dispatch(collectionActions.receivedCollection(collection)),
        );
    } catch (error) {
        // The list request completed (failed), so let's null out the cache.
        collectionSlugsToLoad.forEach((slug) => pendingRequests.clear(slug));

        // Let the state know that we're not loading this any longer.
        collectionSlugsToLoad.forEach((slug) =>
            dispatch(collectionActions.failedCollectionFetch(error, slug)),
        );

        return error;
    }

    // Now await all of the other pending requests. Since they were started as part
    // of another request, that request will handle errors and state. We're just
    // interested if they completed successfully.
    await Promise.all(loadingCollectionPromises);

    // Get the collections that finished loading.
    const resolvedLoadingCollections = selectors.getVariantGroupsBySlugs(loadingCollectionSlugs);

    // Return all of the collections from various sources.
    return loadedCollections.concat(apiLoadedCollections).concat(resolvedLoadingCollections);
};

/**
 * Loads collections for the user's partner
 *
 * @param {bool}  shouldIncludePublicCollections    Whether we should include public header collections along with the private collections
 */
const loadPartnerCollections =
    (shouldIncludePublicCollections = true) =>
    async (dispatch, getState) => {
        const storeState = getState();

        const privateCollectionSlugs =
            selectors.getBrandingProfilePrivateCollectionSlugs(storeState) || [];
        const publicCollectionSlugs = shouldIncludePublicCollections ? // Flatten header collections to an array of slug strings
            selectors.getHeaderCollections(storeState).map(({
                slug
            }) => slug) :
            [];

        // Load all of the collections and return them
        return dispatch(loadCollections(privateCollectionSlugs.concat(publicCollectionSlugs)));
    };

/**
 * Ensures that the collectionView with the corresponding guid
 * is loaded into the store state.
 * @param  { string } collectionViewGUID collectionViewGuid.
 * @return {Promise}
 */
const loadCollectionView = (collectionViewGUID) => async (dispatch, getState) => {
    const storeState = getState();
    const foundCollectionView = selectors.getCollectionViewByGUID(storeState, collectionViewGUID);

    if (foundCollectionView) {
        // Don't fetch if we already have the collectionView
        return foundCollectionView;
    }

    if (!selectors.isFetchingCollectionView(storeState, collectionViewGUID)) {
        // Start fetching the CollectionView
        dispatch(collectionActions.fetchingCollectionView(collectionViewGUID));

        try {
            const fetchingCollectionView = fetchCollectionView(collectionViewGUID);
            // Store the promise in the cache in case we need it later.
            pendingCollectionViewRequests.set(collectionViewGUID, fetchingCollectionView);
            const collectionView = await fetchingCollectionView;

            // The request completed, so let's null out the cache.
            pendingCollectionViewRequests.clear(collectionViewGUID);
            dispatch(collectionActions.receivedCollectionView(collectionView));
            return collectionView;
        } catch (error) {
            // The request completed (failed), so let's null out the cache.
            pendingCollectionViewRequests.clear(collectionViewGUID);
            dispatch(collectionActions.failedCollectionViewFetch(error, collectionViewGUID));
            return error;
        }
        // If we don't have the collectionView loaded, but also don't need to fetch,
        // we should have a cached promise that will return when the collectionView
        // is received from the server.
    } else if (pendingCollectionViewRequests.get(collectionViewGUID)) {
        return pendingCollectionViewRequests.get(collectionViewGUID);
    } else {
        console.error(`Error loading collectionView with guid ${collectionViewGUID}.`);
        return null;
    }
};

/**
 * Loads the variant group with the given slug along with its collection view
 * @param {string} slug   Slug for the variant group to load
 */
const loadVariantGroupAndCollectionView = (slug) => async (dispatch) => {
    const variantGroup = await dispatch(loadCollection(slug));

    // Get the collection view GUID off of the variant group and load the collection view
    const collectionViewGUID = _.get(variantGroup, 'collection_view.guid');
    const collectionView = collectionViewGUID ?
        await dispatch(loadCollectionView(collectionViewGUID)) :
        null;

    return {
        variantGroup,
        collectionView
    };
};

export default {
    loadCollection,
    loadCollections,
    loadPartnerCollections,
    loadCollectionView,
    loadVariantGroupAndCollectionView,
};