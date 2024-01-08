// gtag is a global function defined in `_google_analaytics_v2.jinja`. It queues actions to be handled by GA, namely tracking events.
// Note that in non-production environments, calls to gtag will work, but won't actually get logged in GA. However, you can still use the Google Tag Assistant's debug mode
// to inspect what would be sent to analytics in a production environment (https://tagassistant.google.com/)
/* global gtag */
/* eslint-disable no-console */

// Local
import settings from 'shared/utils/settings.js';
import {
    convertObjectKeysToSnakeCase
} from 'shared/utils/objects.js';

class GoogleAnalyticsService {
    // GA is disabled in non-production environments, so we'll log events to the console for visibility.
    isDebug = settings.APP_ENVIRONMENT !== 'prod';

    pageCategory = '';

    setPageCategory(newCategory) {
        this.pageCategory = newCategory;
    }

    /**
     * Tracks an event with Google Analytics
     *
     * @param {string} eventName      Name of the event to log
     * @param {Object} [eventParams]  Object describing any additional params to tie to the event. GA requires param objects to use snake_case for their keys, but for our own ease of use
     *                                  and to avoid annoying eslint warnings, we can set all params using camelCase and they'll be automatically converted in this function before being sent along.
     *                                  The "eventCategory" param is required to be logged with events, but will fall back to the analytics category for the current page if none is provided.
     *                                  The "eventLabel" and "value" params are also supported by default.
     *                                  Additional params which map to custom dimensions can also be added; our full list of supported custom dimensions can be found by going into GA4 -> Configure -> Custom definitions.
     *                                  Custom dimensions allow us to attach additional meaningful data to our events which can then be cross-referenced. Some of ours include `business_guid`, `user_video_guid`, and `variant_slug`.
     */
    trackEvent(eventName, eventParams = {}) {
        // Ensure all param keys are converted to snake case because GA prefers that
        const snakeCaseParams = convertObjectKeysToSnakeCase(eventParams);

        if (!snakeCaseParams.event_category) {
            // Default to using the current page's analytics category if no event_category param was provided
            snakeCaseParams.event_category = this.pageCategory;
        }

        if (this.isDebug) {
            console.log(`Analytics -- Event: ${eventName}, Params:`, snakeCaseParams);
        }

        gtag ? .('event', eventName, snakeCaseParams);
    }

    /**
     * Tracks a timing metric for how long the user took to do something.
     *
     * @param {string}  eventName   A name describing the timing metric being tracked.
     * @param {number}  time        The time duration being tracked as a number of milliseconds.
     * @param {Object}  [eventParams]   Any additional params for the event, such as "eventCategory", "eventLabel", or custom dimensions.
     */
    trackTiming(eventName, time, eventParams = {}) {
        this.trackEvent('timing_complete', {
            ...eventParams,
            name: eventName,
            // Round the time to the nearest integer because GA prefers that
            value: Math.round(time),
        });
    }

    setUser(appConfig = {}) {
        // Gtag's `set` method doesn't work anymore for tracking custom dimensions, even though their documentation pretends that it does.
        // What a mess. So to get the user-related data we want to track, we have to attach it to an arbitrary event
        this.trackEvent('user_setup', {
            // The `@supports` CSS query can't query for at-rules like `@layer`,
            // but we can test for the existence of the `CSSLayerStatementRule` class
            // as an indicator of cascade layers support.
            supports_cascade_layers: Number('CSSLayerStatementRule' in window),
            // Track some additional dimensions to see if the user's browser supports certain browser
            // features of interest so we can make informed decisions about when it's safe to start using them.
            supports_css_has: Number(window.CSS.supports('selector(:has(*))')),
            supports_cntnr_queries: Number(window.CSS.supports('container-type')),
            sdk_partner_slug: appConfig.sdkPartnerSlug,
            partner_slug: appConfig.brandingProfile ? .partner_slug,
            // Set the shop state guid on GA's built-in client_id dimension to serve as this session's unique id
            client_id: appConfig.shopStateGUID,
            // If appConfig contains an account, set it on GA's built-in user_id dimension
            user_id: appConfig.accountGUID,
        });
    }
}

export default new GoogleAnalyticsService();