// Local
import {
    PURCHASE_ATTEMPT_CLEAR,
    PURCHASE_ATTEMPT_COMPLETE,
    PURCHASE_ATTEMPT_ERROR,
    PURCHASE_ATTEMPT_PENDING,
    PURCHASE_PREMIERE_UPSELL_COMPLETE,
    PURCHASE_PREMIERE_UPSELL_ERROR,
} from '../../actionTypes.js';

const attemptingPurchase = () => ({
    type: PURCHASE_ATTEMPT_PENDING,
});

const completedPurchaseAttempt = (response) => ({
    type: PURCHASE_ATTEMPT_COMPLETE,
    payload: response,
});

const completedPremiereUpsellPurchase = () => ({
    type: PURCHASE_PREMIERE_UPSELL_COMPLETE,
});

const failedPremiereUpsellPurchase = (error) => ({
    type: PURCHASE_PREMIERE_UPSELL_ERROR,
    payload: error,
});

const failedPurchaseAttempt = (error) => ({
    type: PURCHASE_ATTEMPT_ERROR,
    payload: error,
});

const clearPurchaseAttempt = () => ({
    type: PURCHASE_ATTEMPT_CLEAR,
});

export default {
    attemptingPurchase,
    clearPurchaseAttempt,
    completedPremiereUpsellPurchase,
    completedPurchaseAttempt,
    failedPremiereUpsellPurchase,
    failedPurchaseAttempt,
};