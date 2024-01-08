// Vendor
import 'app/../publicPathFix.js';
import {
    ConnectedRouter
} from 'connected-react-router';
import {
    Provider
} from 'react-redux';
import ReactDOM from 'react-dom';

// Local
import history from 'app/state/history.js';
import store from 'app/state/store.js';
import RuntimeConfig from 'shared/utils/RuntimeConfig.js';
import {
    operations
} from 'app/state/ducks/shop/index.js';
import PartnerSitePermissionsRedirect from 'app/components/PartnerSitePermissionsRedirect.js';
import GlobalProviders from 'app/providers/index.js';
import AccountOverrideBanner from 'app/components/AccountOverrideBanner';
import {
    setManagedAccountSessionData
} from 'app/utils/managedAccountSession';
import AppRoutes from 'app/routes/index';

// Import app theme store to ensure it's initialized and sets the appropriate theme class on the root element
import 'app/state/appThemeStore';

const appConfig = RuntimeConfig.getConfig('app');

// Manage admin account override query parameters and session storage values.
setManagedAccountSessionData(appConfig.account_guid);

store.dispatch(
    operations.initializeApp({
        accountGUID: appConfig.account_guid,
        brandingProfile: appConfig.branding_profile,
        anonymousUserInformation: appConfig.anonymous_user_information,
        coupon: appConfig.coupon,
        homepageConfiguration: appConfig.homepage_configuration,
        premiereUpsellCouponGUID: appConfig.premiere_upsell_first_month_free_coupon_guid,
        referralCouponCode: appConfig.referral_coupon_code,
        referralCouponGUID: appConfig.referral_coupon_guid,
        selectedBusinessGUID: appConfig.selected_business_guid,
        shopStateGUID: appConfig.shop_state_guid,
        thirdPartyConfig: appConfig.third_party_config,
    }),
);

ReactDOM.render( <
    Provider store = {
        store
    } >
    <
    ConnectedRouter history = {
        history
    } >
    <
    PartnerSitePermissionsRedirect / >
    <
    GlobalProviders >
    <
    AccountOverrideBanner / >
    <
    AppRoutes / >
    <
    /GlobalProviders> <
    /ConnectedRouter> <
    /Provider>,
    document.querySelector('[data-javascript-only-container]'),
);