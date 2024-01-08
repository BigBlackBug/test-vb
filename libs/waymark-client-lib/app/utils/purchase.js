import _ from 'lodash';

/**
 * Returns the amount of video credits that are included with the provided offer,
 * as determined by the number of `allowed_downloads` in the offer item's configuration_data.
 * @param  {object} offer
 */
export const getVideoCreditsForOffer = (offer) => {
    if (!offer) {
        return 0;
    }

    return _.sumBy(offer.offer_items, (offerItem) => {
        const configurationData = offerItem.configuration_data;
        /* Subscription offers are configured with `allowed_downloads`, while Credits offers
        are configured with `total_credits`. */
        return configurationData.allowed_downloads || configurationData.total_credits || 0;
    });
};

// Month should only be a be number string between 01-12
const CARD_EXPIRY_MONTH_REGEX = /^[0-1][0-9]$/;

// Year should be a string of 2 numbers
const CARD_EXPIRY_YEAR_REGEX = /^[0-9]{2}$/;

// CVV should be a string of either 3 or 4 numbers
const CARD_CVV_REGEX = /^[0-9]{3,4}$/;

/**
 * Perform basic front-end validation on our credit card fields before we contact Stripe.
 * @param  {object} creditCardInfo
 */
export const getBasicCreditCardFieldErrors = (creditCardInfo) => {
    const fieldErrors = {};

    const {
        cardNumber,
        cardExpiryMonth,
        cardExpiryYear,
        cardCVV
    } = creditCardInfo;

    if (!cardNumber) {
        fieldErrors.cardNumber = 'Please enter a credit card number';
    }

    if (!cardExpiryMonth) {
        fieldErrors.cardExpiryMonth = 'Please enter an expiration date';
    } else if (!CARD_EXPIRY_MONTH_REGEX.test(cardExpiryMonth)) {
        fieldErrors.cardExpiryMonth = 'Invalid expiration month';
    }

    if (!cardExpiryYear) {
        fieldErrors.cardExpiryYear = 'Please enter an expiration year';
    } else if (!CARD_EXPIRY_YEAR_REGEX.test(cardExpiryYear)) {
        fieldErrors.cardExpiryYear = 'Invalid expiration year';
    }

    if (!cardCVV) {
        fieldErrors.cardCVV = 'Please enter a valid CVV/CVC number';
    } else if (!CARD_CVV_REGEX.test(cardCVV)) {
        fieldErrors.cardCVV = 'Invalid CVV/CVC number';
    }

    return fieldErrors;
};

/**
 * Constructs a formatted object to be submitted with the offer purchase for
 * a voice-over purchase
 *
 * @param {string} userVideoGUID            The GUID for the user video the VO is being purchased for
 * @param {object} voiceOverConfiguration   Unformatted object representing the user's desired configuration for the VO
 */
export const formatVoiceOverConfigurationForPurchase = (userVideoGUID, voiceOverConfiguration) => ({
    user_video_guid: userVideoGUID,
    special_pronunciations: voiceOverConfiguration.specialPronunciations,
    things_to_emphasize: voiceOverConfiguration.thingsToEmphasize,
    style: voiceOverConfiguration.style,
    timbre: voiceOverConfiguration.timbre,
});

/**
 * Takes a serialized offer object and extracts the purchase price from its offer pricing
 *
 * @param {object}  offer           The offer to get the price of
 * @param {string}  [interval=null] Optional interval to match with available offer pricings.
 */
export const getPriceFromOffer = (offer, interval = null) => {
    if (offer && offer.offer_pricings && offer.offer_pricings.length) {
        if (interval) {
            // Look for an offer pricing that matches the given interval.
            const offerPricing = _.find(offer.offer_pricings, {
                interval
            });
            return _.get(offerPricing, 'amount');
        }

        return offer.offer_pricings[0].amount;
    }

    // If we don't have the offer or offer pricing information, return null.
    return null;
};