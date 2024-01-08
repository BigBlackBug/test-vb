import * as selectors from 'app/state/selectors/index.js';
import {
    appRoutePaths
} from 'app/constants/urls.js';

/**
 * Maps all front-end url routes to analytics category strings
 */
// eslint-disable-next-line import/prefer-default-export
export const appPathAnalyticsCategories = {
    /* Root */
    [appRoutePaths.login]: 'login',
    [appRoutePaths.resetPassword]: 'password_reset',
    [appRoutePaths.signup]: 'signup',
    [appRoutePaths.templateBrowser]: (state) => {
        const partnerSlug = selectors.getBrandingProfilePartnerSlug(state);

        return partnerSlug ? `template_browser-${partnerSlug}` : 'template_browser';
    },

    /* Videos */
    [appRoutePaths.collectionView]: 'collection_view',
    [appRoutePaths.editVariant]: 'variant_editor',

    /* Shop */
    [appRoutePaths.shop]: 'shop',
    [appRoutePaths.checkout]: 'checkout',
    [appRoutePaths.offerCheckout]: 'offer_checkout',
    [appRoutePaths.offerCheckoutSuccess]: 'offer_checkout_complete',
    [appRoutePaths.subscriptionCheckout]: 'premiere_checkout',
    [appRoutePaths.subscriptionCheckoutSuccess]: 'premiere_checkout_complete',

    /* Account */
    [appRoutePaths.accountVideos]: 'account_videos',
    [appRoutePaths.accountSettings]: 'account_settings',
    [appRoutePaths.editYourVideo]: 'user_video_editor',
    [appRoutePaths.manageClientAccounts]: 'manage_client_accounts',
};