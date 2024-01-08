import {
    SHOP_INITIALIZE_PENDING,
    ACCOUNT_FETCH_COMPLETE,
    ACCOUNT_LOGOUT,
} from 'app/state/actionTypes.js';
import offerActions from 'app/state/ducks/offers/actions.js';
import PushService from 'shared/services/PushService.js';

/**
 * Middleware for managing offer-related side effects from redux actions
 */
const offersMiddleware = ({
    dispatch
}) => {
    let purchaseSubscription = null;
    let currentAccountGUID = null;

    /**
     * Callback for account purchase fanout subscription, updates the offer context
     * with the one included in the fanout message
     *
     * @param {string} message  The fanout message as stringified JSON - expected to have properties
     *                            `offer_context` and `client_session_guid`
     */
    const onAccountPurchase = (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.offer_context) {
            // Sync up to the latest account offer context that was included in the fanout message
            dispatch(offerActions.updateOfferContext(parsedMessage.offer_context));
        }
    };

    /**
     * Manage our fanout subscription when the current account changes
     *
     * @param {string} newAccountGUID
     */
    const onAccountGuidChanged = (newAccountGUID) => {
        // If the account guid didn't change, return early
        if (currentAccountGUID === newAccountGUID) return;

        // Store the new account GUID
        currentAccountGUID = newAccountGUID;

        // Cancel the previous subscription if there is one
        if (purchaseSubscription) {
            purchaseSubscription.cancel();
            purchaseSubscription = null;
        }

        if (currentAccountGUID) {
            // Set up a fanout subscription to listen for new purchases for the current account
            purchaseSubscription = PushService.subscribe(
                `/${currentAccountGUID}/account/new_purchase`,
                onAccountPurchase,
            );
        }
    };

    return (next) => (action) => {
        switch (action.type) {
            case SHOP_INITIALIZE_PENDING:
                {
                    onAccountGuidChanged(action.payload.accountGUID);
                    break;
                }
            case ACCOUNT_FETCH_COMPLETE:
                {
                    onAccountGuidChanged(action.payload.guid);
                    break;
                }
            case ACCOUNT_LOGOUT:
                onAccountGuidChanged(null);
                break;

            default:
        }

        return next(action);
    };
};

export default offersMiddleware;