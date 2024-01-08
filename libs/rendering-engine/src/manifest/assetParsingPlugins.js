// Vendor
import _ from 'lodash';
import Ajv from 'ajv';
import {
    VideoProcessingService
} from '@stikdev/video-processing-service-sdk';

// Local
import {
    apiResourceByAssetType,
    imgixParamDefinitions,
    waymarkLocationTypes,
    preferredVideoCodecsByQuality,
    supportedVideoCodecs,
    supportedVideoCodecFilenames,
    supportedVideoCodecMimetypes,
} from './constants.js';
import {
    timecodeScaleMode,
    waymarkAssetModificationFits,
    waymarkVideoAssetModificationsSchema,
} from './schemas.js';
import {
    removeLeadingZero
} from './imgixAPITransforms.js';
import settings, {
    assetQuality,
    timeSyncVideoSeekMode
} from '../settings.js';
import {
    canPlayMimetype,
    determineBestMimetype
} from '../utils/mediaElement.js';
import {
    isURL,
    simplePathJoin
} from '../utils/index.js';

// PLugin registry
export const registeredAssetParsingPlugins = {};

/**
 * Registers the provided plugin as a supported asset plugin.
 *
 * @param  {AssetParsingPlugin} plugin    Asset plugin instance
 */
export const registerAssetParsingPlugin = (plugin) => {
    registeredAssetParsingPlugins[plugin.name] = plugin;
};

const TIMECODE_PROCESSING_DEFINITION = 'downloadRenderWithTimecode';

/**
 * Base plugin class for shared methods and logic used to retrieve Waymark assets.
 *
 * @param {object}        pluginProperties
 * @param {string}        pluginProperties.name         Plugin name
 * @param {Function}      pluginProperties.assetToURL   Defines how to translate an asset into a fetchable url.
 * @public
 */
class AssetParsingPlugin {
    constructor(pluginProperties) {
        if (!pluginProperties || !pluginProperties.name) {
            throw new Error('Plugin name is required');
        }

        if (!pluginProperties.assetToURL || typeof pluginProperties.assetToURL !== 'function') {
            throw new Error('Must provide an `assetToURL` method for the plugin.');
        }

        // Apply the provided plugin properties to the plugin instance.
        Object.assign(this, pluginProperties);
    }
}

/**
 * Helper function for creating asset plugins.
 *
 * @param  {object} pluginProperties   See `AssetParsingPlugin` class for required properties
 * @returns {AssetParsingPlugin} a newly created plugin
 * @private
 */
const createAssetParsingPlugin = (pluginProperties) => new AssetParsingPlugin(pluginProperties);

/**
 * @memberof AssetParsingPlugin
 * @public
 */
export const defaultAssetParsingPlugin = createAssetParsingPlugin({
    name: 'default',
    assetToURL: async (asset) => {
        // Use simplePathJoin because it is not known at this time whether or not asset.u
        // and asset.p combine to a filepath or a URL
        let path = simplePathJoin(asset.u || '', asset.p || '');
        if (!isURL(path)) {
            if (!settings.IS_LOCAL_ASSETS_ENABLED) {
                throw new Error(`Renderer IS_LOCAL_ASSETS_ENABLED is disabled. Cannot load ${path}`);
            }

            if (settings.WAYMARK_DEFAULT_ASSET_PLUGIN_PATH === null) {
                console.warn(
                    'WaymarkAuthorWebRenderer.settings.WAYMARK_DEFAULT_ASSET_PLUGIN_PATH is not set. If you are loading local assets or those without a URL, you must specify the path to these files.',
                );
            }
            // Use simplePathJoin again because rootAssetPath can also be a filepath or a URL
            path = simplePathJoin(settings.WAYMARK_DEFAULT_ASSET_PLUGIN_PATH || '', path);
        }

        return path;
    },
});

/**
 * Returns an imgix url based on the provided source bucket, image key (path), and query params.
 *
 * @param  {string} source        Imgix source domain prefix
 * @param  {string} key           Unique image key: `/path/to/my/image.png`
 * @param  {object} queryParams   Object of query params to include in the returned url
 * @returns {string} The constructed imgix url
 */
const getImgixURL = (source, key, queryParams) => {
    const queryString = Object.keys(queryParams)
        .map((param) => {
            const value = removeLeadingZero(queryParams[param]);
            return `${param}=${value}`;
        })
        .join('&');

    const protocol =
        settings.WAYMARK_ENVIRONMENT && settings.WAYMARK_ENVIRONMENT === 'local' ? 'http' : 'https';

    if (key[0] === '/') {
        console.error(
            `Waymark asset key ${key} has preceding slash. This will likely cause URL fetching errors.`,
        );
    }

    return `${protocol}://${source}.imgix.net/${key}?${queryString}`;
};

/**
 * Provided a Waymark modifications object (or null), returns an object of imgix
 * query params to add to an imgix asset url.
 *
 * @param  {object|null} waymarkModifications The modifications object (if present)
 * @returns {object}  Object of imgix query param key/value pairs
 */
const getImgixParamsFromWaymarkModifications = (waymarkModifications) => {
    const modifications = waymarkModifications ? _.cloneDeep(waymarkModifications) : {};

    // NOTE: We used to validate the input here, but modifications has morphed into a layer properties + modifications merge. So, we no longer do.
    // Will this have any consequences? Hopefully not.

    const hasNoiseReduction = _.has(modifications, 'adjustments.noiseReduction');
    const hasNoiseReductionSharpen = _.has(modifications, 'adjustments.noiseReductionSharpen');

    // Set adjustments.noiseReductionSharpen default to 0.2 when adjustments.noiseReduction is set
    if (hasNoiseReduction && !hasNoiseReductionSharpen) {
        modifications.adjustments.noiseReductionSharpen = 0.2;

        // Set adjustments.noiseReduction default to 0.2 when adjustments.noiseReductionSharpen is set
    } else if (!hasNoiseReduction && hasNoiseReductionSharpen) {
        modifications.adjustments.noiseReduction = 0.2;
    }

    const imgixQueryParams = {};

    // Set all Imgix query params for imgixParamDefinitions items
    Object.keys(imgixParamDefinitions).forEach((paramName) => {
        const {
            dotPath,
            param,
            transform
        } = imgixParamDefinitions[paramName];
        if (_.has(modifications, dotPath)) {
            const value = _.get(modifications, dotPath);
            imgixQueryParams[param] = transform ? transform(value) : value;
        }
    });

    // Set `fm=png` and `auto=unset` params when modifications.fit === 'fill'
    if (modifications.fit === waymarkAssetModificationFits.fill) {
        // Set format to png to support transparency
        imgixQueryParams.fm = 'png';
        // Disable "auto" parameter, which defaults to "compress" for our buckets and takes precedence over "fm=png"
        imgixQueryParams.auto = 'unset';
    }

    // We want to always use the 'max' fit option to preserve aspect ratio of the original image
    imgixQueryParams.fit = 'max';

    // The application of these parameters via the renderer
    ['rect', 'pad', 'bg', 'fill-color', 'fp-z', 'fp-x', 'fp-y', 'crop'].forEach((param) => {
        delete imgixQueryParams[param];
    });

    return imgixQueryParams;
};

/**
 * Handles the translation of a Waymark cropping object with keys
 * { x, y, width, height }
 *
 * @param  {object}   cropping    Waymark cropping object
 * @returns {string}   Value for the imgix `rect` query param.
 */
export const formatCroppingForImgix = (cropping) => {
    const {
        x,
        y,
        width,
        height
    } = cropping;
    return [x, y, width, height].map(removeLeadingZero).join(',');
};

/**
 * Scales width and height to a minimum dimension requirement
 *
 * @param {number}  width   Width
 * @param {number}  height  Height
 * @param {number}  minimum Minimum value for either dimension
 *
 * @returns {object} An object of the width and height
 */
const scaleToMinimumDimension = (width, height, minimum) => {
    const aspect = width / height;
    let scale = 1;
    if (aspect > 1 && height < minimum) {
        scale = minimum / height;
    } else if (aspect <= 1 && width < minimum) {
        scale = minimum / width;
    }

    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale)
    };
};

/**
 * A "base" asset plugin for loading imgix assets from any bucket.
 *
 * @example
 * {
 *  w: 5000,
 *  h: 5000,
 *  modifications: null,
 *  location: {
 *   plugin: 'imgix',
 *   source: 'socialproof-dev',
 *   key: '/path/to/my/image.png`,
 *  }
 * }
 *
 * @memberof AssetParsingPlugin
 * @public
 */
export const imgixAssetParsingPlugin = createAssetParsingPlugin({
    name: 'imgix',
    assetToURL: async (asset, quality) => {
        const imgixQueryParams = getImgixParamsFromWaymarkModifications(
            _.get(asset, 'modifications', null),
        );

        // We want to make sure we are loading the asset with the original asset ratio
        // To do that we only set the dimension on one of the two axes.

        const zoom = _.get(asset, 'modifications.zoom.z', 1);
        let scale = 1;
        if (zoom > 1) {
            // Don't let image size get larger than the original
            if (zoom < 5) {
                scale = 5;
            } else if (zoom > 5) {
                scale = 10;
            }
        }

        const qualityParams = {
            w: asset.w * scale,
            h: asset.h * scale,
            q: 100,
        };

        /*
        TODO: The only reason we're using 0.5 for low and medium is due to a bug in our renderer.
        See: https://stikdev.atlassian.net/browse/WILLOW-236
        When resolved, this should be different than the medium image quality (either
        medium gets bigger, or low gets smaller).
        */
        if (quality === assetQuality.low || quality === assetQuality.medium) {
            qualityParams.w *= 0.5;
            qualityParams.h *= 0.5;
            qualityParams.q = 50;
        }

        const scaledMinWH = scaleToMinimumDimension(
            Math.round(qualityParams.w),
            Math.round(qualityParams.h),
            settings.MIN_IMGIX_ASSET_DIM,
        );

        qualityParams.w = scaledMinWH.width;
        qualityParams.h = scaledMinWH.height;

        return getImgixURL(asset.location.source, asset.location.key, {
            ...imgixQueryParams,
            ...qualityParams,
        });
    },
});

/**
 * Get a dict of Waymark location sources mapped to waymarkLocationTypes.
 * The sources change based on the WAYMARK_ENVIRONMENT.
 *
 * @returns  {object}  Waymark location sources
 */
export const getWaymarkLocationSources = () => {
    if (!Object.keys(settings).includes('WAYMARK_ENVIRONMENT')) {
        console.warn(
            'WaymarkAuthorWebRenderer.settings.WAYMARK_ENVIRONMENT is not set. "dev" will be used.',
        );
    }

    // Unset and 'local' Waymark environments are both treated as 'dev'
    // to maintain image loading capability when testing locally.
    const environment = !settings.WAYMARK_ENVIRONMENT || settings.WAYMARK_ENVIRONMENT === 'local' ?
        'dev' :
        settings.WAYMARK_ENVIRONMENT;

    return {
        [waymarkLocationTypes.socialproofImagesWeb]: {
            aws: `sp-${environment}-s3-images-web`,
            imgix: `socialproof-${environment}`,
        },
        [waymarkLocationTypes.socialproofCustomerAssets]: {
            aws: `sp-${environment}-s3-customer-assets`,
            imgix: `socialproof-${environment}-customer-assets`,
        },
        [waymarkLocationTypes.socialproofS3Assets]: {
            aws: 'sp-prod-s3-assets',
            imgix: 'socialproof-prod-s3-assets',
        },
        [waymarkLocationTypes.waymarkMattkahlScratch]: {
            aws: 'waymark-mattkahl-scratch',
            imgix: 'waymark-mattkahl-scratch',
        },
        [waymarkLocationTypes.waymarkTemplateStudio]: {
            aws: 'waymark-template-studio-development',
            imgix: 'waymark-template-studio-development',
        },
    };
};

/**
 * A plugin based on the imgixAssetParsingPlugin that serves up "Waymark asset", which include:
 *   - Template manifest audio
 *   - Template manifest images
 *   - BusinessImages
 *   - SearchResultImages
 *   - ShopStateImages
 *   - IndustryImages
 *
 * Resizing is handled by the imgixAssetParsingPlugin. The imgix source is determined by the environment.
 * NOTE: BusinessImages, SearchResultImages, and ShopStateImages all share the same imgix bucket of
 * `sp-[env]-s3-customer-assets`. IndustryImages, however, are located in `sp-[env]-s3-images-web`.
 * So we provide a way to specify that an IndustryImage is being requested (or any other asset
 * not in the default `sp-[env]-s3-customer-assets` bucket via the image asset's own `location.type`
 * value.
 *
 * @example
 * // Template manifest audio
 * {
 *   type: 'audio',
 *   location: {
 *     plugin: 'waymark',
 *     key: 'path/to/my/audio.mp3',
 *     type: 'socialproofS3Assets',
 *   }
 * }
 *
 * // Business image
 * {
 *   w: 5000,
 *   h: 5000,
 *   modifications: null,
 *   type: 'image',
 *   location: {
 *     plugin: 'waymark',
 *     key: 'path/to/my/image.png',
 *     type: 'socialproofImagesWeb',
 *   }
 * }
 *
 * @memberof AssetParsingPlugin
 * @public
 */
export const waymarkAssetParsingPlugin = createAssetParsingPlugin({
    name: 'waymark',
    assetToURL: async (asset, quality) => {
        if (!['audio', 'image', 'video'].includes(asset.type)) {
            throw new Error(
                `The plugin 'waymark' only supports assets of type 'audio', 'image', and 'video', not ${asset.type}.`,
            );
        }

        const newAsset = _.cloneDeep(asset);
        const waymarkLocationSources = getWaymarkLocationSources();
        const source = waymarkLocationSources[newAsset.location.type];

        if (asset.type === 'image') {
            newAsset.location.source = source.imgix;
            return imgixAssetParsingPlugin.assetToURL(newAsset, quality);
        }

        let s3Key = newAsset.location.key;

        if (asset.type === 'video') {
            if (!_.has(asset, 'modifications.hasTimecode')) {
                _.set(asset, 'modifications.hasTimecode', true);
            }

            if (asset.modifications.hasTimecode) {
                // Begin asset.modifications setters
                /* eslint-disable no-param-reassign */
                // Set timecode scale mode to 'relative'
                // This means that the timecode is a relative size that may be downscaled
                // if the video it's attached to has been downscaled.
                // A 1080p master video, for example, is expected to have an 18px
                // timecode, but if that master is downscaled to 720p, the equivalent
                // `relative` timecode would be 12px.
                // All pre-Waymark-vps timecodes are `relative`.
                // All post waymarkTemplateStudio migration waymark-vps timecodes
                // will be `fixed`.
                if (!('timecodeScaleMode' in asset.modifications)) {
                    asset.modifications.timecodeScaleMode = timecodeScaleMode.relative;
                }

                if (!('timecodeSettings' in asset.modifications)) {
                    asset.modifications.timecodeSettings = {
                        timecodeDigitCount: 10,
                        timecodeDigitHeight: 18,
                        timecodeDigitWidth: 18,
                        timecodePlacement: 'bottom',
                    };
                }

                if (!('videoAssetHeightMode' in asset.modifications)) {
                    asset.modifications.videoAssetHeightMode = 'assetWithPadding';
                    asset.modifications.videoAssetHeightPadding =
                        asset.modifications.timecodeSettings.timecodeDigitHeight;
                }

                if (!('shouldUseTimecode' in asset.modifications)) {
                    asset.modifications.shouldUseTimecode = false;
                }
                // End asset.modifications setters
                /* eslint-enable no-param-reassign */
            }

            const modifications = _.cloneDeep(asset.modifications);

            const ajv = new Ajv({
                allErrors: true,
                useDefaults: true
            });
            const validator = ajv.compile(waymarkVideoAssetModificationsSchema);

            const isValid = validator(modifications);
            if (!isValid) {
                throw new Error(JSON.stringify(validator.errors));
            }

            // For a video asset, we'll need to determine what the browser prefers as far as video format is concerned and then
            // pick the best transcoded video.
            if (
                settings.SHOULD_FETCH_ENCODED_WAYMARK_ASSET_PLUGIN_FOOTAGE &&
                _.get(newAsset.location, 'shouldLoadEncodedAsset', true)
            ) {
                const videoCodecs = preferredVideoCodecsByQuality[quality];

                let bestVideoCodec;

                // Automatically use the fallback if we're not in a browser
                if (typeof window === 'undefined') {
                    bestVideoCodec = videoCodecs[videoCodecs.length - 1];
                    // Otherwise, determine the highest priority, test to see if it works, and then
                    // use a fallback if needed
                } else {
                    let highestPriorityVideoCodec;
                    // TODO: We need a configuration or trigger for high quality video asset export
                    // eslint-disable-next-line no-constant-condition
                    if (settings.TIME_SYNC_VIDEO_SEEK_MODE === timeSyncVideoSeekMode.accurate) {
                        if (quality === 'high' && videoCodecs.includes(supportedVideoCodecs.highH264)) {
                            highestPriorityVideoCodec = supportedVideoCodecs.highH264;
                        } else if (
                            quality === 'medium' &&
                            videoCodecs.includes(supportedVideoCodecs.mediumH264)
                        ) {
                            highestPriorityVideoCodec = supportedVideoCodecs.mediumH264;
                        }
                    }

                    if (highestPriorityVideoCodec) {
                        const mimetype = supportedVideoCodecMimetypes[highestPriorityVideoCodec];
                        if (['maybe', 'probably'].includes(canPlayMimetype(mimetype))) {
                            bestVideoCodec = highestPriorityVideoCodec;
                        }
                    }

                    if (!bestVideoCodec) {
                        const bestMimetype = determineBestMimetype(
                            videoCodecs.map((videoCodec) => supportedVideoCodecMimetypes[videoCodec]),
                        );

                        bestVideoCodec = videoCodecs.find(
                            (videoCodecKey) => supportedVideoCodecMimetypes[videoCodecKey] === bestMimetype,
                        );
                    }
                }

                // For something like 'my/path/video.mov' this will evaluate to '/my/path/'. For 'video.mov' it will evaluate
                // to '', because 'video.mov' and '/video.mov' are not the same thing in S3. Leading slashes are advised against
                // in S3 storage.
                const enclosingDirectory =
                    s3Key.indexOf('/') === -1 ? '' : s3Key.substring(0, s3Key.lastIndexOf('/') + 1);
                const filename = supportedVideoCodecFilenames[bestVideoCodec];

                s3Key = `${enclosingDirectory}${filename}`;
            }
        }

        const protocol =
            settings.WAYMARK_ENVIRONMENT && settings.WAYMARK_ENVIRONMENT === 'local' ? 'http' : 'https';

        if (newAsset.location.key[0] === '/') {
            console.error(
                `Waymark asset key ${newAsset.location.key} has preceding slash. This will likely cause URL fetching errors.`,
            );
        }

        return `${protocol}://${source.aws}.s3.amazonaws.com/${s3Key}`;
    },
});

/**
 * A plugin based on the imgixAssetParsingPlugin that serves up Waymark Template Studio images.
 * Resizing is handled by the imgixAssetParsingPlugin.
 *
 * Set the `WAYMARK_TEMPLATE_STUDIO_PLUGIN_HOST` setting (which defaults to '') to specify where the studio API
 * is located. (e.g. `WaymarkAuthorWebRenderer.settings.WAYMARK_TEMPLATE_STUDIO_PLUGIN_HOST = 'http://localhost:4000'`).
 *
 * @example
 * {
 *  w: 5000,  // Images only
 *  h: 5000,  // Images only
 *  modifications: null,
 *  type: 'image' || 'audio',
 *  location: {
 *   plugin: 'waymark-template-studio',
 *   id: 'nwgQBDjt4T`, // publicId of the asset record
 *  }
 * }
 *
 * @memberof AssetParsingPlugin
 * @public
 */
export const waymarkTemplateStudioAssetParsingPlugin = createAssetParsingPlugin({
    name: 'waymark-template-studio',
    assetToURL: async (asset, quality) => {
        if (!['audio', 'image', 'video'].includes(asset.type)) {
            throw new Error(
                `The plugin 'waymark-template-studio' only supports assets of type 'audio', 'image', and 'video', not ${asset.type}.`,
            );
        }

        if (settings.WAYMARK_TEMPLATE_STUDIO_PLUGIN_HOST === null) {
            console.warn(
                'WaymarkAuthorWebRenderer.settings.WAYMARK_TEMPLATE_STUDIO_PLUGIN_HOST is not set. Unless you have a proxy configured, it probably should be set to the location of the Waymark Template Studio (e.g. `https://studio.waymark.com`).',
            );
        }

        const api = `${settings.WAYMARK_TEMPLATE_STUDIO_PLUGIN_HOST || ''}${
      apiResourceByAssetType[asset.type]
    }`;

        const path = `${api}${asset.location.id}/`;

        let data;

        try {
            const response = await fetch(path);
            // fetch won't throw an exception if a URL loads correctly but responds with an error status:
            // 404, 500, etc.
            if (!response.ok) {
                throw new Error(
                    `fetch ${path} failed with status ${response.status}: ${response.statusText}`,
                );
            }

            data = await response.json();
        } catch (e) {
            // Prevent URL load errors from bubbling
            console.error('assetToURL content load error', e);
            return '';
        }

        let location;

        if (asset.type === 'audio') {
            location = {
                key: data.audio,
                plugin: 'waymark',
                type: 'waymarkTemplateStudio',
            };
        } else if (asset.type === 'video') {
            // TODO: This is temporary until all Studio VideoTemplateVideos are backfilled with a vpsSourceKey
            //       remove and add error once all videos are backfilled with a vpsSourceKey
            if (data.vpsSourceKey) {
                location = {
                    sourceVideo: data.vpsSourceKey,
                    plugin: 'waymark-vps',
                };
            } else {
                location = {
                    key: data.video,
                    plugin: 'waymark',
                    type: 'waymarkTemplateStudio',
                };
            }
        } else if (asset.type === 'image') {
            location = {
                key: data.image,
                plugin: 'waymark',
                type: 'waymarkTemplateStudio',
            };
        }

        const waymarkAsset = {
            modifications: asset.modifications,
            type: asset.type,
            location,
        };

        if (asset.type === 'image' || asset.type === 'video') {
            waymarkAsset.w = asset.w;
            waymarkAsset.h = asset.h;
        }

        return registeredAssetParsingPlugins[location.plugin].assetToURL(waymarkAsset, quality);
    },
});

/**
 * Allows for the loading of video assets from the Waymark Video Processing Service
 *
 * @example
 * {
 *  type: 'video',
 *  location: {
 *   plugin: 'waymark-vps',
 *   sourceVideo: 'ab12cd34',
 *  }
 * }
 *
 * @memberof AssetParsingPlugin
 * @public
 */
export const waymarkVideoProcessingServicePlugin = createAssetParsingPlugin({
    name: 'waymark-vps',
    assetToURL: async (asset) => {
        if (asset.type !== 'video') {
            throw new Error(
                `The plugin 'waymark-vps' only supports assets of type 'video', not ${asset.type}.`,
            );
        }

        if (!(asset.location && asset.location.sourceVideo)) {
            throw new Error(
                "The plugin 'waymark-vps' must have a property of 'sourceVideo' in the 'location'.",
            );
        }

        const sourceVideoKey = asset.location.sourceVideo;

        // TODO: Remove `false &&` ref: #removewhenvpsupgradedandbackfille
        let processingDefinition;
        // eslint-disable-next-line no-constant-condition
        if (false && settings.TIME_SYNC_VIDEO_SEEK_MODE === timeSyncVideoSeekMode.accurate) {
            processingDefinition = TIMECODE_PROCESSING_DEFINITION;
        } else {
            const preferredFormats = {
                // NOTE: These are commented out while we investigate how to speed up transcoding performance
                // 'video/webm; codecs="vp9, vorbis"': 'webPlayer_vp9',
                // 'video/mp4; codecs="hvc1.1.6.L93.90, mp4a.40.2"': 'webPlayer_h265',
                'video/mp4; codecs="avc1.42C020, mp4a.40.2"': 'webPlayer_h264',
            };

            try {
                const bestMimetype = determineBestMimetype(Object.keys(preferredFormats));
                processingDefinition = preferredFormats[bestMimetype];
            } catch (error) {
                if (typeof window === 'undefined') {
                    // eslint-disable-next-line no-console
                    console.log(
                        "It appears you're not in a browser environment. Falling back to a h264 format.",
                    );
                    processingDefinition = 'webPlayer_h264';
                } else {
                    throw error;
                }
            }
        }

        const videoProcessingService = new VideoProcessingService({
            // TODO: This is currently harcoded. It has to be until we have client-side service discovery
            websocketEndpoint: 'wss://mdlgolkxaf.execute-api.us-east-2.amazonaws.com/Prod',
        });

        // TODO: This is temporary until the backfill of all videos occurs ref: #removewhenvpsupgradedandbackfilled
        // eslint-disable-next-line no-param-reassign
        asset.modifications = { ...asset.modifications,
            shouldUseTimecode: false
        };

        // TODO: This is a temporary workaround until we remove all master videos that have timecodes from the VPS ref: #removewhenvpsupgradedandbackfille
        if (asset.location.legacyTimecode) {
            const {
                nativeVideoWidth,
                nativeVideoHeight
            } = asset.location.legacyTimecode;
            // eslint-disable-next-line no-param-reassign
            asset.w = nativeVideoWidth;
            // eslint-disable-next-line no-param-reassign
            asset.h = nativeVideoHeight;
            // eslint-disable-next-line no-param-reassign
            asset.modifications = { ...asset.modifications,
                hasTimecode: true
            };
        } else {
            try {
                // Fetch and set the master's height and width dimensions off of the asset.
                const {
                    width,
                    height
                } = await videoProcessingService.analyzeProcessedOutput(
                    sourceVideoKey,
                    'master',
                );
                // eslint-disable-next-line no-param-reassign
                asset.w = width;
                // eslint-disable-next-line no-param-reassign
                asset.h = height;
            } catch (masterError) {
                const webPlayerDerivative = 'webPlayer_h264';

                // If there's no master output, see if there's a raw preview with metadata that contains the
                // dimensions.
                try {
                    // Because raw preview is not a valid output in the Coconut job definitions, and the
                    // raw_preview directory hierarchy is different from the rest of the processed tree, we'll
                    // extrapolate the location from the webPlayer_h264 derivative.
                    const webPlayerLocation = videoProcessingService.describeProcessedOutput(
                        sourceVideoKey,
                        webPlayerDerivative,
                    ).locations[0];

                    const rawPreviewLocation = webPlayerLocation.replace(webPlayerDerivative, 'raw_preview');

                    const metadataURL = rawPreviewLocation.replace(/\.mp4$/, '/metadata.json');

                    const rawPreviewResponse = await fetch(metadataURL, {
                        method: 'GET'
                    });
                    if (rawPreviewResponse.ok) {
                        const rawPreviewMetadata = await rawPreviewResponse.json();
                        asset.w = rawPreviewMetadata.width;
                        asset.h = rawPreviewMetadata.height;
                    }
                } catch (rawPreviewMetadataError) {
                    // Technically, this is an "oh crap" moment. We need this dimension information.
                    // There are some passing tests that don't properly mock the `analyzeProcessedOutput` which means those
                    // tests pass, but technically the asset hasn't been properly modified with a width and height.
                    console.error(
                        `Error fetching dimensions for video asset (${sourceVideoKey}):`,
                        rawPreviewMetadataError,
                    );
                }
            }
        }

        if (!_.has(asset, 'modifications.hasTimecode')) {
            /**
             * NOTE: HERE BE DRAGONS
             * We are currently assuming all assets that come through the VPS plugin do NOT have a timecode
             * while everything else will have a timecode. This is temporary until we backfill existing
             * templates with video assets. This DOES modify the asset.
             * ref: #removewhenvpsupgradedandbackfille
             */
            _.set(
                asset,
                'modifications.hasTimecode',
                processingDefinition === TIMECODE_PROCESSING_DEFINITION,
            );
        }

        // Begin asset.modifications setters
        /* eslint-disable no-param-reassign */
        if (asset.modifications.hasTimecode) {
            // Set timecode scale mode to 'fixed'
            // This means that the timecode is always a fixed size (18px) regardless of
            // whether the video it's attached to has been scaled.
            // All post waymarkTemplateStudio migration waymark-vps timecodes
            // will be `fixed`.
            if (!('timecodeScaleMode' in asset.modifications)) {
                asset.modifications.timecodeScaleMode = timecodeScaleMode.fixed;
            }

            if (!('timecodeSettings' in asset.modifications)) {
                asset.modifications.timecodeSettings = {
                    timecodeDigitCount: 20,
                    timecodeDigitHeight: 10,
                    timecodeDigitWidth: 10,
                    timecodePlacement: 'bottom',
                };
            }

            // Set the timecode `padding` when there is a legacy timecode.
            // The top padding is equal to the height of the legacy timecode, which
            // resides above the non-legacy timecode.
            if (
                asset.location.legacyTimecode &&
                !('timecodePaddingTop' in asset.modifications.timecodeSettings)
            ) {
                asset.modifications.timecodeSettings.timecodePaddingTop = 18;
            }

            if (!('shouldUseTimecode' in asset.modifications)) {
                asset.modifications.shouldUseTimecode = true;
            }
        }

        if (!('videoAssetHeightMode' in asset.modifications)) {
            if (asset.location.legacyTimecode) {
                // Set the video asset height `padding` when there is a legacy timecode.
                // The video asset height padding represents a value that must be
                // subtracted from the JSON-manifest-defined asset height to retrieve
                // the true height of the video (not including timecodes).
                // This value exists because pre-vps asset definitions may include the
                // height of the legacy timecode in the JSON definition.
                // Neither pre-vps nor post-vps asset definitions will include the
                // height of non-legacy timecodes in the JSON definition.
                asset.modifications.videoAssetHeightMode = 'assetWithPadding';
                asset.modifications.videoAssetHeightPadding = 18;
            } else {
                asset.modifications.videoAssetHeightMode = 'assetOnly';
            }
        }
        // End asset.modifications setters
        /* eslint-enable no-param-reassign */

        const output = videoProcessingService.describeProcessedOutput(
            sourceVideoKey,
            processingDefinition,
        );

        let videoUrl = output.locations[0];

        // If we are in high quality asset mode, attempt to fetch the finalAsset derivative and use its
        // URL if we find it. Otherwise, fallback to the original derivative, or if that hasn't been
        // created yet, to a raw preview if available.
        if (settings.ASSET_QUALITY === assetQuality.high) {
            const highQualityOutput = videoProcessingService.describeProcessedOutput(
                sourceVideoKey,
                'finalAsset_h264',
            );

            // Check for final asset derivative
            const highQualityOutputUrl = highQualityOutput.locations[0];
            const response = await fetch(highQualityOutputUrl, {
                method: 'HEAD'
            });

            if (response.ok) {
                videoUrl = highQualityOutputUrl;
            }
        } else {
            // Check for the derivative from the processing definition
            const defaultOutputResponse = await fetch(videoUrl, {
                method: 'HEAD'
            });
            if (!defaultOutputResponse.ok) {
                const webPlayerDerivative = 'webPlayer_h264';

                const webPlayerLocations = videoProcessingService.describeProcessedOutput(
                    sourceVideoKey,
                    webPlayerDerivative,
                ).locations;

                let rawPreviewOutputUrl = webPlayerLocations[0].replace(webPlayerDerivative, 'raw_preview');
                rawPreviewOutputUrl = rawPreviewOutputUrl.replace(/\.mp4$/, `/${sourceVideoKey}.mp4`);

                // Check for a raw preview
                const rawPreviewOutputResponse = await fetch(rawPreviewOutputUrl, {
                    method: 'HEAD'
                });
                if (rawPreviewOutputResponse.ok) {
                    videoUrl = rawPreviewOutputUrl;
                }
            }
        }

        return videoUrl;
    },
});

/**
 * Construct a URL to an audio asset in the current APS S3 location scheme.
 */
export function buildAudioAssetURL(host, derivative, sourceAudioKey) {
    return `${host}/assets/audio/derivatives/${derivative}/${sourceAudioKey}_${derivative}.m4a`;
}

/**
 * Construct a URL to an audio asset in the old APS S3 location scheme.
 */
export function buildOldAudioAssetURL(derivative, sourceAudioKey) {
    let host =
        settings.WAYMARK_ENVIRONMENT === 'prod' ?
        'https://wm-aps-production.s3.us-west-1.amazonaws.com' :
        'https://wm-aps-development.s3.us-west-1.amazonaws.com';
    return `${host}/derivatives/_${derivative}/${sourceAudioKey}_${derivative}.m4a`;
}

/**
 * Allows for the loading of audio assets from the Waymark Audio Processing Service
 *
 * TODO: Once the old APS is decommissioned, use the service access SDK here instead of deriving the
 * S3 host and prefix from the settings.
 *
 * @example
 * {
 *  type: 'audio',
 *  location: {
 *   plugin: 'waymark-aps',
 *   sourceAudio: 'ab12cd34',
 *  }
 * }
 *
 * @memberof AssetParsingPlugin
 * @public
 */
export const waymarkAudioProcessingServicePlugin = createAssetParsingPlugin({
    name: 'waymark-aps',
    assetToURL: async (asset) => {
        if (asset.type !== 'audio') {
            throw new Error(
                `The plugin 'waymark-aps' only supports assets of type 'audio', not ${asset.type}.`,
            );
        }

        if (!(asset.location && asset.location.sourceAudio)) {
            throw new Error(
                "The plugin 'waymark-aps' must have a property of 'sourceAudio' in the 'location'.",
            );
        }

        const derivative =
            settings.ASSET_QUALITY === assetQuality.high ? 'downloadRender' : 'webPlayer';

        const sourceAudioKey = asset.location.sourceAudio;

        let urls = [];

        if (settings.APS_ASSET_HOST) {
            urls.push(buildAudioAssetURL(settings.APS_ASSET_HOST, derivative, sourceAudioKey));
        }

        urls.push(buildOldAudioAssetURL(derivative, sourceAudioKey));

        for (let url of urls) {
            const response = await fetch(url, {
                method: 'HEAD'
            });

            if (response.ok) {
                return url;
            } else {
                console.error(`Audio asset not found at ${url}`);
            }
        }

        // Throw up our hands and return the first URL, which probably won't work, but maybe processing
        // just hasn't completed yet.
        return urls[0];
    },
});

/**
 * An asset plugin for loading bitmap font assets from any bucket.
 *
 * @example
 * {
 *  id: "Neue Haas Grotesk Bold"
 *  type: "bitmapFont"
 *  location: {
 *   plugin: 'bitmap-font-service',
 *   id: 'ab12cd34,
 *  }
 * }
 *
 * @memberof AssetParsingPlugin
 * @public
 */
export const bitmapFontAssetParsingPlugin = createAssetParsingPlugin({
    name: 'bitmap-font-service',
    assetToURL: ({
        location,
        weight,
        isItalic
    }) => {
        if (location.id === 'default') {
            return `${settings.WAYMARK_BFS_HOST}/fallback-font-manifest?weight=${weight}${
        isItalic ? '&isItalic=1' : ''
      }`;
        } else if (location.legacyId) {
            return `${settings.WAYMARK_BFS_HOST}/legacy-font-families/${
        location.legacyId
      }?weight=${weight}${isItalic ? '&isItalic=1' : ''}`;
        }
        // Make an API call to the bitmap font service with the id
        return `${settings.WAYMARK_BFS_HOST}/font-variants/${location.id}`;
    },
});

// This moved from /src/index.js so that external repos could import this chunk of code and run it in
// non-browser environments (specifically node).
// Register plugins for asset loading.
[
    defaultAssetParsingPlugin,
    imgixAssetParsingPlugin,
    waymarkAssetParsingPlugin,
    waymarkTemplateStudioAssetParsingPlugin,
    waymarkVideoProcessingServicePlugin,
    waymarkAudioProcessingServicePlugin,
    bitmapFontAssetParsingPlugin,
].forEach(registerAssetParsingPlugin);