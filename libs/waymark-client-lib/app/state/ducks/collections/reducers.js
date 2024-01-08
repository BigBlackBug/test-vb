// Local
import {
    replaceOrAdd,
    removePropertyFromCollection
} from 'shared/utils/collections.js';
import {
    COLLECTION_FETCH_PENDING,
    COLLECTION_FETCH_COMPLETE,
    COLLECTION_FETCH_ERROR,
    COLLECTION_VIEW_FETCH_PENDING,
    COLLECTION_VIEW_FETCH_COMPLETE,
    COLLECTION_VIEW_FETCH_ERROR,
} from '../../actionTypes.js';

/**
 * Reducers
 *
 * Items are the collection and it's related video variants.
 * Items are then displayed with the retrieved view.
 */
const DEFAULT_STATE = {
    itemsBeingFetched: [],
    viewsBeingFetched: [],
    error: '',
    items: [
        // {slug: 'all_videos', video_template_variants: [ 'slug1', 'slug2' ]}
    ],
    views: [
        // {guid: 'abc123', display_name: 'foobar'}
    ],
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case COLLECTION_FETCH_PENDING:
            return {
                ...state,
                itemsBeingFetched: [].concat(state.itemsBeingFetched, action.payload),
            };

        case COLLECTION_FETCH_ERROR:
            return {
                ...state,
                error: action.payload.error,
                itemsBeingFetched: removePropertyFromCollection(
                    state.itemsBeingFetched,
                    action.payload,
                    'slug',
                ),
            };

        case COLLECTION_FETCH_COMPLETE:
            {
                // Ensure we can safely treat the payload as an array whether we received an array or a single collection
                const receivedCollections = Array.isArray(action.payload) ? action.payload : [action.payload];

                const collectionsWithFormattedVariantArray = receivedCollections.map((collection) => ({
                    ...collection,
                    // Flatten the variant_group_variants array into something we can use in the UI more easily
                    videoTemplateVariants: collection.variant_group_variants.map(
                        ({
                            video_template_variant: variant
                        }) => variant,
                    ),
                }));

                return {
                    ...state,
                    itemsBeingFetched: removePropertyFromCollection(
                        state.itemsBeingFetched,
                        action.payload,
                        'slug',
                    ),
                    items: replaceOrAdd(state.items, collectionsWithFormattedVariantArray, 'slug'),
                };
            }

        case COLLECTION_VIEW_FETCH_PENDING:
            return {
                ...state,
                viewsBeingFetched: [].concat(state.viewsBeingFetched, action.payload),
            };

        case COLLECTION_VIEW_FETCH_ERROR:
            return {
                ...state,
                error: action.payload.error,
                viewsBeingFetched: removePropertyFromCollection(
                    state.viewsBeingFetched,
                    action.payload,
                    'guid',
                ),
            };

        case COLLECTION_VIEW_FETCH_COMPLETE:
            return {
                ...state,
                viewsBeingFetched: removePropertyFromCollection(
                    state.viewsBeingFetched,
                    action.payload,
                    'guid',
                ),
                views: replaceOrAdd(state.views, action.payload, 'guid'),
            };

        default:
            return state;
    }
};