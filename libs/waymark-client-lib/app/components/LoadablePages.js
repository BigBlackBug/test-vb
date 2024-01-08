import LoadablePage from 'app/components/LoadablePage.js';
import UnbrandedLoadablePage from 'app/components/UnbrandedLoadablePage.js';

/*
 * Components that load via a LoadablePage import() call will load on component initialization,
 * rather than on page load. Currently these are used by the various frontend routers for code splitting.
 */

// Shared
export const WaymarkEditPage = UnbrandedLoadablePage(() =>
    import ('app/components/WaymarkEditPage.js'),
);
export const SDKEditPage = UnbrandedLoadablePage(() =>
    import ('app/components/SDKEditPage'));
export const SDKAI1XPage = UnbrandedLoadablePage(() =>
    import ('app/components/AI1XPage/SDKPage'));
export const SDKLandingPage = UnbrandedLoadablePage(() =>
    import ('app/components/SDKLandingPage'));
export const PageNotFoundPage = LoadablePage(() =>
    import ('app/components/PageNotFoundPage.js'));

// RootRouter
export const AuthPage = LoadablePage(() =>
    import ('app/components/AuthPage'));
export const VideoPreviewPage = UnbrandedLoadablePage(() =>
    import ('app/components/VideoPreviewPage'),
);
export const ResetPasswordPage = LoadablePage(() =>
    import ('app/components/ResetPasswordPage.js'));
export const TemplateBrowserPage = LoadablePage(() =>
    import ('app/components/TemplateBrowserPage'));
export const AI1XPage = LoadablePage(() =>
    import ('app/components/AI1XPage'));

// ShopRouter
export const OfferCheckoutSuccessPage = LoadablePage(() =>
    import ('app/components/OfferCheckoutSuccessPage.js'),
);
export const CheckoutPage = UnbrandedLoadablePage(() =>
    import ('app/containers/CheckoutPage.js'));
export const OfferCheckoutPage = LoadablePage(() =>
    import ('app/containers/OfferCheckoutPage.js'));

// AccountRouter
export const AccountSettingsPage = LoadablePage(() =>
    import ('app/components/AccountSettingsPage'));
export const AccountVideosPage = LoadablePage(() =>
    import ('app/components/AccountVideosPage/index'),
);
export const ManagedAccountsPage = LoadablePage(() =>
    import ('app/components/ManagedAccountsPage'));

// CustomerPortalRouter
export const ManageUsersPage = UnbrandedLoadablePage(() =>
    import ('app/components/ManageUsersPage.js'),
);
export const BillingSummaryPage = UnbrandedLoadablePage(() =>
    import ('app/components/BillingSummaryPage'),
);