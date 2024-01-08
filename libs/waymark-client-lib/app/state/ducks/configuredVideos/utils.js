import PushService from 'shared/services/PushService.js';
import {
    createRenderCompleteEventKey
} from 'app/constants/PushEvents.js';

const renderCompleteSubscriptions = {};

/**
 * Opens a subscription to render completion push events
 *
 * @param {string} accountGUID      The account GUID whose render events we want to subscribe to
 * @param {func}  onRenderComplete  Callback for when a render complete event is received; will receive a ConfiguredVideo as a param
 */
export const openRenderCompleteSubscriptionForAccount = (accountGUID, onRenderComplete) => {
    // Ensures the subscription event payload gets parsed into an object.
    const eventPayloadParser = async (payload) => {
        await onRenderComplete(JSON.parse(payload));
    };

    // If we don't have any subscriptions for the account guid yet, create a map that we can store them in
    if (!renderCompleteSubscriptions[accountGUID]) {
        // Using a Map to store subscriptions because this allows us to use functions as keys,
        // meaning we can easily add/remove multiple event listeners for the same account!
        renderCompleteSubscriptions[accountGUID] = new Map();
    }

    // Create a push subscription and store it in our map
    renderCompleteSubscriptions[accountGUID].set(
        onRenderComplete,
        PushService.subscribe(createRenderCompleteEventKey(accountGUID), eventPayloadParser),
    );
};

/**
 * Cancels any existing render subscription
 *
 * @param {string} accountGUID      The account GUID that we are cancelling a render subscription for
 * @param {func}  onRenderComplete  The callback that we will cancel the subscription for.
 *                                    This needs to be the exact same function that was previously passed to
 *                                    an `openRenderCompleteSubscriptionForAccount` call so we can correctly find and remove the subscription.
 */
export const cancelRenderCompleteSubscriptionForAccount = (accountGUID, onRenderComplete) => {
    const accountRenderCompleteSubscriptionMap = renderCompleteSubscriptions[accountGUID];
    if (
        // Check to ensure we have a map of subscriptions for the given account and we have a subscription
        // stored for the given `onRenderComplete` callback
        accountRenderCompleteSubscriptionMap &&
        accountRenderCompleteSubscriptionMap.has(onRenderComplete)
    ) {
        // Cancel the subscription and delete it from the map
        const subscriptionToCancel = accountRenderCompleteSubscriptionMap.get(onRenderComplete);
        subscriptionToCancel.cancel();
        accountRenderCompleteSubscriptionMap.delete(onRenderComplete);
    }
};