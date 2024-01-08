/* eslint-disable no-console */
// Local
import {
    upscaleImageLibraryImage
} from 'shared/api/index.js';
import PushService from 'shared/services/PushService.js';

const IMAGE_ENHANCEMENT_FANOUT_CHANNEL = 'images/image_enhanced';

// Timeout in milliseconds.
export const imageEnhancementResponseTimeout = 60000; // 60s
export const upscaleImageSizeLimit = 2000000; // 2MP

/**
 * Service handles requests and responses from the Waymark Image Enhancement Service.
 */
class ImageEnhancementService {
    requests = new Map();

    /**
     * Request an upscaled version of a library image.
     * Responses are managed by provided success and error callback functions.
     *
     * @returns undefined
     */
    async upscaleImage({
        imageLibraryImageGUID,
        onSuccess,
        onError
    }) {
        const channelName = ImageEnhancementService.getChannelName(imageLibraryImageGUID);

        console.info(`IMAGE ENHANCEMENT: Subscribing for response: `, channelName);

        const subscription = PushService.subscribe(channelName, (payload) => {
            console.info(`IMAGE ENHANCEMENT: Received event for ${imageLibraryImageGUID}`);

            if (!this.requests.get(imageLibraryImageGUID)) {
                console.warn(
                    `IMAGE ENHANCEMENT: Subscription unable to find request for ${imageLibraryImageGUID}`,
                );
                return;
            }

            const response = JSON.parse(payload);

            this.handleImageEnhancementResponse(imageLibraryImageGUID, response, onSuccess, onError);
        });

        this.requests.set(imageLibraryImageGUID, subscription);

        try {
            await upscaleImageLibraryImage(imageLibraryImageGUID);

            // Once the request has successfully been submitted, set a timeout for listeners in case something
            // prevents a response
            this.setRequestTimeout(imageLibraryImageGUID, onError);
        } catch (error) {
            console.error(`IMAGE ENHANCEMENT: Problem enhancing image: ${error}`);
            onError();
        }
    }

    /**
     * Dispatch a generated video response and cancel listening.
     */
    handleImageEnhancementResponse(imageLibraryImageGUID, response, onSuccess, onError) {
        if (response.data.error) {
            console.error(
                `IMAGE ENHANCEMENT: ${imageLibraryImageGUID} response error: ${JSON.stringify(
          response.data.error,
        )}`,
            );
            onError(response.data.error);
        } else {
            console.info(`IMAGE ENHANCEMENT: enhancement for ${imageLibraryImageGUID} successful`);
            onSuccess(response);
        }

        // Stop listening for responses
        this.cancelSubscriptionForRequest(imageLibraryImageGUID);
    }

    /**
     * Once the defined timeout limit has been exceeded, cancel the Fanout subscription for a request.
     *
     * @param {string} imageLibraryImageGUID - Used to identify the correct request object in this class's internal list
     * @param {func} onRequestTimeout - Callback invoked once timeout limit is reached
     */
    setRequestTimeout(imageLibraryImageGUID, onRequestTimeout) {
        setTimeout(() => {
            // If the request has not been cleared, the response has timed out
            if (this.requests.get(imageLibraryImageGUID)) {
                console.error(`IMAGE ENHANCEMENT: request timeout for ${imageLibraryImageGUID}`);

                this.cancelSubscriptionForRequest(imageLibraryImageGUID);
                onRequestTimeout();
            }
        }, imageEnhancementResponseTimeout);
    }

    /**
     * Find the request object for an image, cancel the associated Fanout subscription, and remove the request from this
     * class's internal list so that it's no longer being tracked.
     *
     * @param {string} imageLibraryImageGUID - Used to identify the correct request object in this class's internal list
     *
     * @returns undefined
     */
    cancelSubscriptionForRequest(imageLibraryImageGUID) {
        console.info(
            `IMAGE ENHANCEMENT: Canceling image enhancement subscription ${imageLibraryImageGUID}`,
        );
        const requestSubscription = this.requests.get(imageLibraryImageGUID);
        requestSubscription.cancel();

        this.requests.delete(imageLibraryImageGUID);
    }

    /**
     * Construct Fanout channel name for Image Enhancement responses.
     *
     * @param {string} imageLibraryImageGUID - Fanout channel identifier
     * @returns {string} - Fanout channel name
     */
    static getChannelName(imageLibraryImageGUID) {
        return `/${imageLibraryImageGUID}/${IMAGE_ENHANCEMENT_FANOUT_CHANNEL}`;
    }
}

export default new ImageEnhancementService();