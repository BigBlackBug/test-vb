/* eslint-disable no-console */
// Local
import {
    generateVideo,
    getGeneratedVideo
} from 'shared/api/index.js';
import PushService from 'shared/services/PushService.js';
import {
    uuid
} from 'shared/utils/uuid.js';
import {
    base64ToJson
} from 'shared/utils/compression.js';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';

const GENERATED_VIDEO_FANOUT_CHANNEL = '/autofill/generated-video';

// We expect successful calls to the Autofill Service to respond in about a minute. At 75
// seconds we will force a timeout because at that point we are reasonably sure that the
// request has timed out or we will not receive a response. The timeout is larger than the
// expected timeout to account for the time it takes our API to make the request and receive an
// error response plus a little wiggle room while we nail down the response time.
// The autofill service timeout is currently 90 seconds.

// Timeout in milliseconds.
export const autofillResponseTimeout = 93000;

// How long to wait before we start polling for a response if nothing has come over the
// websocket, in milliseconds.
const autofillPollingTimeout = 30000;

// How often to poll for results, in milliseconds.
const autofillPollingInterval = 5000;

/**
 * A singleton that manages requests to the Autofill Service.
 */
class AutofillService {
    REQUEST_SOURCES = {
        waymarkAI: 'waymark_ai',
        editor: 'editor',
    };

    requests = new Map();

    /**
     * Main entry point for class.
     *
     * Requests video descriptor for a VideoTemplateVariant, personalized with business data.
     *
     * 1. Subscribe to async responses for this request using Fanout
     * 2. Track requests
     * 3. API call to invoke AutofillService
     *
     * @param {object} params
     * @param {string} params.requestSource - The source of the request. One of the values in this.REQUEST_SOURCES
     * @param {string} params.businessGUID - Business instance GUID. Variant configuration personalized with data from this business.
     * @param {string} params.variantSlug - Compound variant slug.
     * @param {string} [params.userVideoGUID]
     * @param {string} [params.userInstructions] - Custom instructions to use for script generation; if null or an empty string, we'll fall back to default instructions on the backend.
     * @param {string} [params.vibe] - The selected vibe for this generation.
     * @param {func} params.onGenerationSuccess - Callback provided to Autofill Service. Invoked when success response is returned asynchronously.
     * @param {func} params.onVideoDescriptorError - Callback provided to Autofill Service. Invoked when error response is returned asynchronously.
     *
     * @returns undefined
     */
    async requestVideoDescriptor({
        requestSource,
        businessGUID,
        variantSlug,
        onGenerationSuccess,
        onVideoDescriptorError,
        userVideoGUID = null,
        userInstructions = null,
        vibe = null,
    }) {
        // Construct a unique identifier for this request
        const requestGUID = uuid();
        const channelName = AutofillService.getRequestChannel(requestGUID);

        console.info(`AUTOFILL: Subscribing for autofill response: `, channelName);

        // In order to avoid a race condition with the Autofill Service, subscribe to listen for
        // async responses to this request before calling the service.
        const subscription = PushService.subscribe(channelName, (payload) => {
            console.info(`AUTOFILL: Received event for ${requestGUID}`);

            if (!this.requests.get(requestGUID)) {
                console.warn(`AUTOFILL: Subscription unable to find request for ${requestGUID}`);
                return;
            }

            const response = base64ToJson(payload);

            this.handleGeneratedVideoResponse(
                requestGUID,
                response,
                onGenerationSuccess,
                onVideoDescriptorError,
            );
        });

        this.requests.set(requestGUID, subscription);

        try {
            // This request kicks off the autofill process. There is a response, but nothing we currently need to track here.
            // The video descriptor is NOT returned in this response, but in an asychronous response from the AutofillService.
            await generateVideo({
                requestSource,
                businessGUID,
                compoundSlug: variantSlug,
                requestGUID,
                userVideoGUID,
                userInstructions,
                vibe,
            });

            // Once the request has successfully been submitted, set a timeout for listeners in case something
            // prevents a response
            this.setRequestTimeout(requestGUID, onVideoDescriptorError);

            // Start the countdown for polling. When this timer finishes we'll start polling for the
            // generated video if we haven't received one over the websocket.
            this.setPollingTimeout(requestGUID, onGenerationSuccess, onVideoDescriptorError);

            return requestGUID;
        } catch (error) {
            // This is just meant to catch an errors returned from the API call to our server, this is not handling for
            // an error response from the Autofill Service to this request.
            console.error('AUTOFILL: Problem requesting video descriptor:', error);
            onVideoDescriptorError();

            return null;
        }
    }

    /**
     * Dispatch a generated video response and cancel listening.
     */
    async handleGeneratedVideoResponse(
        requestGUID,
        response,
        onGenerationSuccess,
        onVideoDescriptorError,
    ) {
        if (response.error) {
            console.error(`AUTOFILL: ${requestGUID} response error: ${response.error}`);
            onVideoDescriptorError();
        } else {
            console.info(`AUTOFILL: generated video for ${requestGUID} successful`);
            try {
                await onGenerationSuccess(response, requestGUID);
            } catch (err) {
                console.error(`AUTOFILL: ${requestGUID} error processing response:`, err);
                onVideoDescriptorError();
            }
        }

        // Stop listening for responses
        this.cancelSubscriptionForRequest(requestGUID);
    }

    /**
     * Once the defined timeout limit has been exceeded, cancel the Fanout subscription for a request.
     *
     * @param {string} requestGUID - Used to identify the correct request object in this class's internal list
     * @param {func} onRequestTimeout - Callback invoked once timeout limit is reached
     */
    setRequestTimeout(requestGUID, onRequestTimeout) {
        setTimeout(() => {
            // If the request has not been cleared, the response has timed out
            if (this.requests.get(requestGUID)) {
                console.error(`AUTOFILL: request timeout for ${requestGUID}`);

                this.cancelSubscriptionForRequest(requestGUID);
                onRequestTimeout();

                // Track the timeout in google analytics
                GoogleAnalyticsService.trackEvent('autofill_timeout', {
                    eventCategory: 'autofill',
                    eventLabel: requestGUID,
                    value: autofillResponseTimeout,
                });
            }
        }, autofillResponseTimeout);
    }

    /**
     * Start polling for results if we haven't received anything yet.
     *
     * @param {string} requestGUID - Used to identify the correct request object in this class's internal list
     * @param {func} onGenerationSuccess - Callback invoked if a successful video is returned
     * @param {func} onVideoDescriptorError - Callback invoked if the video generation resulted
     * in an error
     *
     * @returns undefined
     */
    setPollingTimeout(requestGUID, onGenerationSuccess, onVideoDescriptorError) {
        setTimeout(() => {
            const intervalHandle = setInterval(async () => {
                // If the request has been cleared, the response has timed out or has already been
                // received.
                if (this.requests.get(requestGUID)) {
                    console.info(`AUTOFILL: polling for generated video for ${requestGUID}`);
                    try {
                        const response = await getGeneratedVideo(requestGUID);

                        if (!response.isComplete) {
                            // This is the only case where we don't want to clear the interval: the request
                            // is still live (ie. not canceled), we've successfully polled the backend, and
                            // the response says that the video generation is still in process.
                            console.info(`AUTOFILL: generated video for ${requestGUID} still in process`);
                            return;
                        }

                        await this.handleGeneratedVideoResponse(
                            requestGUID,
                            response,
                            onGenerationSuccess,
                            onVideoDescriptorError,
                        );
                    } catch (e) {
                        console.error(`AUTOFILL: Unable to poll for generated video: ${e}`);
                    }
                }

                // In all other cases the interval is done, either via success or errors..
                console.info(`AUTOFILL: stopping polling for ${requestGUID}`);
                clearInterval(intervalHandle);
            }, autofillPollingInterval);
        }, autofillPollingTimeout);
    }

    /**
     * Find the request object for a given request GUID, cancel the associated Fanout subscription, and remove the request from this
     * class's internal list so that it's no longer being tracked.
     *
     * @param {string} requestGUID - Used to identify the correct request object in this class's internal list
     *
     * @returns undefined
     */
    cancelSubscriptionForRequest(requestGUID) {
        console.info(`AUTOFILL: Canceling autofill subscription ${requestGUID}`);
        const requestSubscription = this.requests.get(requestGUID);
        requestSubscription.cancel();

        this.requests.delete(requestGUID);
    }

    /**
     * Construct Fanout channel name for Autofill Service responses.
     *
     * @param {string} requestGUID - Unique identifier, used to identify Fanout channel
     * @returns {string} - Fanout channel name
     */
    static getRequestChannel(requestGUID) {
        return `/${requestGUID}${GENERATED_VIDEO_FANOUT_CHANNEL}`;
    }
}

export default new AutofillService();