// Holds constants related to purchase offers.

// Offer for Video Downloads bought via a subscription.
export const freeVideoDownloadSubscriptionSlug = 'video_download_subscription_free_download';
// Offer for Video Downloads bought via a pack.
export const freeVideoDownloadCreditSlug = 'video_download_credit_free_download';
// Offer for Video Downloads via enterprise purchase (no subscription, no packs). These video
// downloads are not linked to any other offer (see get_product_dependencies in
// product_types.py).
export const freeVideoDownloadSlug = 'free-video';

export const premierePackSlugSet = [
    'video_download_credits_10_premiere',
    'video_download_credits_05_premiere',
    'video_download_credits_02_premiere',
];

export const videoDownloadSubscriptionTypes = {
    lifetimeDeal: 'lifetime_deal',
    premiere: 'premiere',
    pro: 'pro',
    facebookAd: 'facebook_ad',
};

export const videoDownloadSubscription99Slug = 'video_download_subscription_99_600';

export const baseVoiceoverOfferSlug = 'voiceover-base';

export const productTypes = {
    voiceover: 'voiceover',
    videoDownload: 'video_download',
    videoDownloadSubscription: 'video_download_subscription',
    subscriptionFreeVideoDownload: 'video_download_subscription_free_download',
    creditFreeVideoDownload: 'video_download_credit_free_download',
};