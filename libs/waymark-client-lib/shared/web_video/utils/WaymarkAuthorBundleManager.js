/* eslint-disable max-classes-per-file */
// Vendor
import axios from 'axios';
// Local
import {
    uuid
} from 'shared/utils/uuid.js';
import {
    WAYMARK_AUTHOR_PREVIEW_SLUG
} from 'editor/constants/Editor';
import {
    nonWaymarkAuthorTemplateSlugs
} from './WaymarkAuthorBundleManagerConstants.js';

import {
    VideoDescriptor,
    TemplateBundle
} from '@libs/shared-types';

const baseTemplateDataDirectoryURL =
    'https://sp-prod-s3-assets.s3.amazonaws.com/web/video_creatives';

/**
 * Manages loading/retrieving bundle data for new templates that use the WaymarkAuthorConfigurator
 * This is a singleton whose instance will be shared between all places it's used in the app
 */
export class WaymarkAuthorBundleManagerClass {
    bundleCache = {};
    // Object where we can cache data for bundles that have already been loaded in this session,
    // keyed by bundle slug. While the bundle is loading, this will contain a Promise that will
    // resolve to the the loaded bundle or to an error.
    requestingBundleManifest = {};

    /**
     * Load all bundle files for a template given its slug.
     *
     * @param {string}  slug  The slug for the template we're checking.
     *
     * @returns {Promise<TemplateBundle>}  Returns the loaded bundle object, or an error object if the load failed.
     */
    loadBundle = async (slug) => {
        // Return the in-progress or resolved manifest if it exists. This will allow for a throttling
        // of simultaneous requests for a template's bundle
        if (this.requestingBundleManifest[slug]) {
            return this.requestingBundleManifest[slug];
        }

        // Return a cache hit if it exists
        if (this.bundleCache[slug]) {
            return this.bundleCache[slug];
        }

        this.requestingBundleManifest = axios
            // A unique ID is currently appended as a query parameter to bust the browser cache.
            .get(`${baseTemplateDataDirectoryURL}/${slug}/bundle.json?wmcachebust=${uuid()}`, {
                responseType: 'json',
            })
            .catch((error) => {
                this.requestingBundleManifest[slug] = null;
                throw error;
            })
            .then((response) => {
                this.bundleCache[slug] = response.data;
                return this.bundleCache[slug];
            });

        return this.requestingBundleManifest;
    };

    /**
     * Wait for bundle data to finish loading and then return the dataType portion of interest.
     *
     * @param {string}  slug      The slug for the template we're retrieving data for.
     *
     * @returns {Promise<TemplateBundle>}  Returns the desired bundle data OR an error object if the bundle failed to load.
     */
    getBundleData = async (slug) => {
        const loadedBundle = await this.loadBundle(slug);

        return loadedBundle;
    };

    /**
     * Returns whether a template slug matches an existing Pixi template
     *
     * @param {string}  slug  The slug for the template we're checking
     *
     * @returns {bool}  Whether the template is a waymark author template
     */
    // eslint-disable-next-line class-methods-use-this
    isWaymarkAuthorTemplate = (slug) =>
        slug === WAYMARK_AUTHOR_PREVIEW_SLUG || !nonWaymarkAuthorTemplateSlugs.includes(slug);

    /**
     * Gets the editor form description from the given template's bundle
     *
     * @param {string}  slug  The slug for the template we're checking
     *
     * @returns {object}  The editor's form description
     */
    getEditorFormDescription = async (slug) => (await this.getBundleData(slug)).__cachedEditingForm;

    /**
     * Gets the editing actions from the given template's bundle
     *
     * @param {string}  slug  The slug for the template we're checking
     *
     * @returns {object}  The template's editing actions
     */
    getEditingActions = async (slug) => (await this.getBundleData(slug)).__cachedEditingActions;

    /**
     * Creates a configurator class which can be used in the TemplateCoordinator
     * using the data from the given template's bundle
     *
     * @param {VideoDescriptor}  videoDescriptor
     * @param {object}              studioPreviewOverrides
     *
     * @return {class}  The class for the template's configurator
     */
    createConfiguratorClass = async (videoDescriptor, studioPreviewOverrides) => {
        // TODO: Make sure studio preview works
        if (studioPreviewOverrides) {
            this.bundleCache[WAYMARK_AUTHOR_PREVIEW_SLUG] = {
                projectManifest: videoDescriptor.projectManifest,
                __cachedEditingActions: studioPreviewOverrides.editingActions,
            };
        }

        // TODO: Do we need this at all?
        const {
            __cachedEditingActions,
            configurationSchema
        } = await this.getBundleData(
            videoDescriptor.__templateSlug,
        );

        /**
         * NOTE: The webpackChunkName comment is significant and should not be moved.
         *       It determines an alternative name for the chunk instead of just using the chunk ID, eg.
         *           21-waymarkAuthorConfigurator-57756f6b110dbbb7769e.bundle.chunk.js
         *       While this does not affect the operation of the dynamic import, it does make debugging
         *       and timing easier.
         *       See https://webpack.js.org/api/module-methods#magic-comments for more details.
         */
        const importModule = await
        import (
            /* webpackChunkName: "waymarkAuthorConfigurator" */
            'shared/web_video/configurator/WaymarkAuthorConfigurator'
        );
        const WaymarkAuthorConfigurator = importModule.default;
        if (studioPreviewOverrides) {
            // Author preview
            return class BundleConfigurator extends WaymarkAuthorConfigurator {
                constructor(canvas, options = {}) {
                    super(canvas, {
                        projectManifest: videoDescriptor.projectManifest,
                        templateManifest: videoDescriptor.templateManifest,
                        editingActions: studioPreviewOverrides.editingActions,
                        slug: videoDescriptor.__templateSlug,
                        // Pass down options to the WaymarkAuthorWebRenderer
                        rendererOptions: {
                            additionalPixiOptions: {
                                // Set the backgroundColor to bright green so it will be obvious
                                backgroundColor: 0x00ff00,
                            },
                        },
                        // The master audio layer UUID is not set until after a bundle has been published, so it will not
                        // be present in in-progress Studio projects. We need a value for the editing actions to pass
                        // validation checks, so we can give it any string for now.
                        masterAudioLayerUUID: 'fake-layer-uuid',
                        ...options,
                    });
                }
            };
        }

        return class BundleConfigurator extends WaymarkAuthorConfigurator {
            constructor(canvas, options = {}) {
                super(canvas, {
                    projectManifest: videoDescriptor.projectManifest,
                    templateManifest: videoDescriptor.templateManifest,
                    editingActions: __cachedEditingActions,
                    configurationSchema,
                    slug: videoDescriptor.__templateSlug,
                    // Provide the master audio layer UUID to the Configurator so that it can update the bundle
                    // to handle audio layers correctly
                    masterAudioLayerUUID: videoDescriptor.templateManifest.__backgroundAudioLayerUUID,
                    ...options,
                });
            }
        };
    };
}

// Export an instance so this is a singleton
export default new WaymarkAuthorBundleManagerClass();