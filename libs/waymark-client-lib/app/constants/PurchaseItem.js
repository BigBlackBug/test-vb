export const itemTypes = {
    ad: 'ad',
    pack: 'pack',
    subscription: 'subscription',
    video: 'video',
};

export const intervals = {
    month: 'month',
    year: 'year',
};

/* Maps our ProductType slugs from an OfferItem to purchaseItem categories. */
export const itemTypesByProductTypeSlug = {
    facebook_image_ad: itemTypes.ad,
    facebook_video_ad: itemTypes.ad,
    facebook_video_ad_download: itemTypes.video,
    video_download: itemTypes.video,
    video_download_subscription: itemTypes.subscription,
    video_download_subscription_free_download: itemTypes.video,
    video_download_credits: itemTypes.pack,
    video_download_credit_free_download: itemTypes.video,
};