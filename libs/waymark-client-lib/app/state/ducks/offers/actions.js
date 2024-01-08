import {
    OFFERS_CLEAR,
    OFFERS_FETCH_COMPLETE,
    OFFERS_FETCH_ERROR,
    OFFERS_FETCH_PENDING,
    OFFERS_SELECT_OFFER,
    OFFERS_CLEAR_OFFER,
    OFFERS_UPDATE_OFFER_CONTEXT,
} from 'app/state/actionTypes.js';

// Action Creations

/**
 * Starting a fetch for offers from the server.
 */
const fetchingOffers = () => ({
    type: OFFERS_FETCH_PENDING,
});

/**
 * Received offers from the server.
 * @param  {Object || Array} offers
 */
const receivedOffers = (offers) => ({
    type: OFFERS_FETCH_COMPLETE,
    payload: offers,
});

/**
 * Failed offer fetching.
 * @param  {String} error
 */
const failedOffersFetch = (error) => ({
    type: OFFERS_FETCH_ERROR,
    payload: error,
});

/**
 * Failed offer fetching.
 * @param  {String} error
 */
const clearOffers = () => ({
    type: OFFERS_CLEAR,
});

/**
 * Set the selected offer for single one off purchases outside of the cart.
 */
const selectOffer = (offer) => ({
    type: OFFERS_SELECT_OFFER,
    payload: offer,
});

/**
 * Clear the set selected offer.
 */
const clearSelectedOffers = () => ({
    type: OFFERS_CLEAR_OFFER,
});

/**
 * Update the currently stored offer context
 *
 * @param {object} newOfferContext
 */
const updateOfferContext = (newOfferContext) => ({
    type: OFFERS_UPDATE_OFFER_CONTEXT,
    payload: newOfferContext,
});

export default {
    clearOffers,
    failedOffersFetch,
    fetchingOffers,
    receivedOffers,
    selectOffer,
    clearSelectedOffers,
    updateOfferContext,
};