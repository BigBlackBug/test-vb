// Local
import {
    COLLECTION_FETCH_PENDING,
    COLLECTION_FETCH_COMPLETE,
    COLLECTION_FETCH_ERROR,
    COLLECTION_VIEW_FETCH_PENDING,
    COLLECTION_VIEW_FETCH_COMPLETE,
    COLLECTION_VIEW_FETCH_ERROR,
} from '../../actionTypes.js';

const fetchingCollection = (slug) => ({
    type: COLLECTION_FETCH_PENDING,
    payload: slug,
});

const receivedCollection = (collection) => ({
    type: COLLECTION_FETCH_COMPLETE,
    payload: collection,
});

const failedCollectionFetch = (error, slug) => ({
    type: COLLECTION_FETCH_ERROR,
    payload: {
        error,
        slug
    },
});

const fetchingCollectionView = (guid) => ({
    type: COLLECTION_VIEW_FETCH_PENDING,
    payload: guid,
});

const receivedCollectionView = (collectionView) => ({
    type: COLLECTION_VIEW_FETCH_COMPLETE,
    payload: collectionView,
});

const failedCollectionViewFetch = (error, guid) => ({
    type: COLLECTION_VIEW_FETCH_ERROR,
    payload: {
        error,
        guid
    },
});

export default {
    failedCollectionFetch,
    fetchingCollection,
    receivedCollection,
    fetchingCollectionView,
    receivedCollectionView,
    failedCollectionViewFetch,
};