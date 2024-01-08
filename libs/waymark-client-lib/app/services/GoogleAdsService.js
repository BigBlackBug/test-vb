// Vendor
import _ from 'lodash';

// Local
import settings from 'shared/utils/settings.js';
import {
    addToCartEvent,
    clickGetStartedEvent,
    clickPersonalizeEvent,
    firstPurchaseEvent,
    newAccountEvent,
    premiereSignupEvent,
    purchaseEvent,
} from 'app/constants/ConversionEvents.js';

// Maps the name of the conversion event to the GoogleAds conversion identifier.
const CONVERSION_EVENT_IDS = {
    [addToCartEvent]: 'ezd0CJCBoIsBELbXmNkD',
    [clickGetStartedEvent]: '1bj0CNvRtosBELbXmNkD',
    [clickPersonalizeEvent]: 'oVCtCPbRtosBELbXmNkD',
    [firstPurchaseEvent]: 'Wz7eCMqwvYoBELbXmNkD',
    [newAccountEvent]: 'CjGPCOH2rYsBELbXmNkD',
    [premiereSignupEvent]: 'ewHxCMnhsosBELbXmNkD',
    [purchaseEvent]: 'He4_CNqd4YgBELbXmNkD',
};

/**
 * We're disabling no console because this file if it's in debug mode will console log
 * so there's a lot and it just makes sense to disable the rule.
 * We disable the no-undef rule as gtag is defined in a global scope by the View.
 *
 * We also define a global variable of gtag for the Google Analytics global Object.
 * It is defined on the parent veiwset and should be accessible here.
 */
/* global gtag_report_conversion */
/* eslint-disable no-console */
class GoogleAdsService {
    constructor({
        isDebug
    } = {
        isDebug: settings.DEBUG
    }) {
        this.isDebug = isDebug;
    }

    /**
     * Track a Google Ads conversion event.
     *
     * @param  {string} conversionName
     *  Name of the conversion event to track. This is mapped to the Google Ads conversion identifier
     *  in our CONVERSION_EVENT_IDS constant (above).
     * @param  {string} transactionID
     *  Unique identifier for the conversion event to protect against duplicate conversion tracking.
     *  (For example, don't track multiple "New Account" conversions for the same accounts GUID.)
     * @param  {number} [value]
     *  The monetary amount (in USD) to associate with the conversion event (most relevant for purchase events).
     * @param  {function} [callback]
     *  An optional callback to execute after the conversion has been registered.
     */
    trackConversion({
        conversionName,
        transactionID,
        value = 0,
        callback = _.noop
    }) {
        const conversionID = CONVERSION_EVENT_IDS[conversionName];
        if (this.isDebug) {
            console.log(
                `Google Ads Event: -> ${conversionName} conversion (ID ${conversionID}) -> value: ${value} -> transactionID ${transactionID}`,
            );
            callback();
        } else {
            /* If the global isn't defined, it likely means a staff user is logged in, and therefore
            we didn't load our tracking scripts to avoid tracking internal traffic. In that case,
            let's simply return. */
            if (window.gtag_report_conversion === undefined) {
                console.warn(
                    'No Google Ads conversion script loaded on the page -- returning without tracking conversion.',
                );
                return;
            }

            gtag_report_conversion(conversionID, transactionID, value, callback);
        }
    }
}

export default new GoogleAdsService();