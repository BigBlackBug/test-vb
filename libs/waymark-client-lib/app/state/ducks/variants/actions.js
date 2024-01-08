// Local
import {
    VARIANT_FETCH_PENDING,
    VARIANT_FETCH_COMPLETE,
    VARIANT_FETCH_ERROR,
} from '../../actionTypes.js';

const fetchingVariant = (slugOrGUID) => ({
    type: VARIANT_FETCH_PENDING,
    payload: slugOrGUID,
});

const receivedVariant = (variant) => ({
    type: VARIANT_FETCH_COMPLETE,
    payload: variant,
});

const failedVariantFetch = (error, slugOrGUID) => ({
    type: VARIANT_FETCH_ERROR,
    payload: {
        error,
        slugOrGUID
    },
});

export default {
    failedVariantFetch,
    fetchingVariant,
    receivedVariant,
};