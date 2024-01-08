import RuntimeConfig from './RuntimeConfig.js';

const config = RuntimeConfig.getConfig('core/settings');
export default {
    DEBUG: config.DEBUG || false,
    APP_ENVIRONMENT: config.APP_ENVIRONMENT,
    APP_NAME: config.APP_NAME,
    APS_ASSET_HOST: config.APS_ASSET_HOST,
    SITE_URL: config.SITE_URL,
    STATIC_URL: config.STATIC_URL,
    // Get appropriate imgix domains for this environment
    IMGIX_DOMAIN: config.IMGIX_DOMAIN,
    IMGIX_CUSTOMER_ASSETS_DOMAIN: config.IMGIX_CUSTOMER_ASSETS_DOMAIN,
    IMGIX_VIDEO_RENDERING_DOMAIN: config.IMGIX_VIDEO_RENDERING_DOMAIN,
    IMGIX_S3_ASSETS_DOMAIN: config.IMGIX_S3_ASSETS_DOMAIN,
    SHOULD_DEBUG_ALT_ACTIONS: false,
    BFS_S3_URL: config.BFS_S3_URL,
    BFS_API_ENDPOINT: config.BFS_API_ENDPOINT,
};