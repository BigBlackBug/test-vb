// Local
import {
    ACCOUNT_FETCH_PENDING,
    ACCOUNT_FETCH_COMPLETE,
    ACCOUNT_FETCH_ERROR,
    ACCOUNT_REQUEST_PASSWORD_RESET,
    ACCOUNT_RECEIVED_SERVICE_ACCESS_TOKEN,
    ACCOUNT_RESET_EMAIL_COMPLETE,
    ACCOUNT_RESET_EMAIL_ERROR,
    ACCOUNT_RESET_EMAIL_PENDING,
    ACCOUNT_EMAIL_RESET_TIMEOUT,
    ACCOUNT_RESET_PASSWORD_COMPLETE,
    ACCOUNT_RESET_PASSWORD_ERROR,
    ACCOUNT_RESET_PASSWORD_PENDING,
    ACCOUNT_PASSWORD_RESET_TIMEOUT,
    ACCOUNT_SEND_PASSWORD_RESET_EMAIL_COMPLETE,
    ACCOUNT_SEND_PASSWORD_RESET_EMAIL_ERROR,
    ACCOUNT_SEND_PASSWORD_RESET_EMAIL_PENDING,
    ACCOUNT_SUBSCRIPTIONS_FETCH_COMPLETE,
    ACCOUNT_SUBSCRIPTIONS_FETCH_ERROR,
    ACCOUNT_SUBSCRIPTIONS_FETCH_PENDING,
    SHOP_INITIALIZE_PENDING,
    ACCOUNT_LOGOUT,
} from '../../actionTypes.js';

// Reducers
export const DEFAULT_STATE = {
    account: {},
    error: '',
    hasFetchedAccount: false,
    serviceAccessToken: null,
    hasResetEmail: false,
    hasResetPassword: false,
    isFetchingAccount: false,
    isFetchingReferrals: false,
    isFetchingSubscription: false,
    isResettingEmail: false,
    isResettingPassword: false,
    isSendingPasswordResetEmail: false,
    shouldRequestPasswordReset: false,
    facebookAdSubscriptions: [],
    videoDownloadSubscriptions: [],
};

// eslint-disable-next-line default-param-last
export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case ACCOUNT_FETCH_PENDING:
            return {
                ...state,
                isFetchingAccount: true,
            };

        case ACCOUNT_FETCH_COMPLETE:
            return {
                ...state,
                account: action.payload,
                hasFetchedAccount: true,
                isFetchingAccount: false,
            };

        case ACCOUNT_FETCH_ERROR:
            return {
                ...state,
                error: action.payload,
                isFetchingAccount: false,
            };

        case ACCOUNT_RECEIVED_SERVICE_ACCESS_TOKEN:
            return {
                ...state,
                serviceAccessToken: action.payload,
            };

        case ACCOUNT_SUBSCRIPTIONS_FETCH_PENDING:
            return {
                ...state,
                isFetchingSubscription: true,
            };

        case ACCOUNT_SUBSCRIPTIONS_FETCH_COMPLETE:
            return {
                ...state,
                facebookAdSubscriptions: action.payload.facebook_ad_subscriptions ? .map((subscription) => ({
                    nextPayment: subscription.next_payment,
                    startedAt: subscription.started_at,
                    slug: subscription.slug,
                    price: subscription.price,
                    interval: subscription.interval,
                    subscriptionType: subscription.subscription_type,
                    name: subscription.name,
                    validThrough: subscription.valid_through,
                    isActive: subscription.is_active,
                    guid: subscription.guid,
                })),
                videoDownloadSubscriptions: action.payload.video_download_subscriptions ? .map(
                    (subscription) => ({
                        nextCredits: subscription.next_credits,
                        nextPayment: subscription.next_payment,
                        startedAt: subscription.started_at,
                        slug: subscription.slug,
                        price: subscription.price,
                        videoCredits: subscription.video_credits,
                        interval: subscription.interval,
                        subscriptionType: subscription.subscription_type,
                        name: subscription.name,
                        validThrough: subscription.valid_through,
                        isActive: subscription.is_active,
                        isUnlimited: subscription.is_unlimited,
                        guid: subscription.guid,
                    }),
                ),
                isFetchingSubscription: false,
            };

        case ACCOUNT_SUBSCRIPTIONS_FETCH_ERROR:
            return {
                ...state,
                error: action.payload,
                isFetchingSubscription: false,
            };

        case SHOP_INITIALIZE_PENDING:
            {
                // Only update the state if we actually have an account guid.
                if (action.payload.accountGUID) {
                    return {
                        ...state,
                        account: {
                            guid: action.payload.accountGUID,
                        },
                    };
                }
                return state;
            }

        case ACCOUNT_SEND_PASSWORD_RESET_EMAIL_PENDING:
            return {
                ...state,
                isSendingPasswordResetEmail: true,
            };

        case ACCOUNT_SEND_PASSWORD_RESET_EMAIL_COMPLETE:
        case ACCOUNT_SEND_PASSWORD_RESET_EMAIL_ERROR:
            return {
                ...state,
                isSendingPasswordResetEmail: false,
            };

        case ACCOUNT_RESET_EMAIL_COMPLETE:
            return {
                ...state,
                account: {
                    ...state.account,
                    email_address: action.payload,
                },
                hasResetEmail: true,
            };

        case ACCOUNT_RESET_EMAIL_PENDING:
            return {
                ...state,
                hasResetEmail: false,
            };

        case ACCOUNT_RESET_EMAIL_ERROR:
            return {
                ...state,
                hasResetEmail: false,
            };

        case ACCOUNT_RESET_PASSWORD_PENDING:
            return {
                ...state,
                isResettingPassword: true,
            };

        case ACCOUNT_RESET_PASSWORD_ERROR:
            return {
                ...state,
                isResettingPassword: false,
            };

        case ACCOUNT_RESET_PASSWORD_COMPLETE:
            return {
                ...state,
                isResettingPassword: false,
                shouldRequestPasswordReset: false,
                hasResetPassword: true,
            };

        case ACCOUNT_REQUEST_PASSWORD_RESET:
            return {
                ...state,
                shouldRequestPasswordReset: true,
            };

        case ACCOUNT_PASSWORD_RESET_TIMEOUT:
            return {
                ...state,
                hasResetPassword: false,
            };

        case ACCOUNT_EMAIL_RESET_TIMEOUT:
            return {
                ...state,
                hasResetEmail: false,
            };

        case ACCOUNT_LOGOUT:
            // Reset to default initial state on logout
            return DEFAULT_STATE;

        default:
            return state;
    }
};