/* eslint-disable max-classes-per-file */
/**
 * This module provides utilities and functionality around the
 * VideoTemplateCoordinator.
 */

//  Allowing multiple components because this is a module

// Vendor
import _ from 'lodash';
import EventEmitter from 'wolfy87-eventemitter';

// Local
import {
    waitFor
} from 'shared/utils/async.js';
import {
    VideoDescriptor
} from '@libs/shared-types';

import WaymarkAuthorBundleManager from 'shared/web_video/utils/WaymarkAuthorBundleManager.js';
import WaymarkAuthorConfigurator from 'shared/web_video/configurator/WaymarkAuthorConfigurator';

/**
 * Thrown when a getConfigurator call is interrupted due to a later superceding call.
 */
export class GetConfiguratorInterruptedException extends Error {}

/**
 * Aims to be a coordinator that will facilitate the need of a consumer (likely a component)
 * to rifle through various VideoSpecs while maintaining a single configurator that represents the
 * latest VideoSpec.
 *
 * The primary interface is via the `configurator` instance variable and the `getConfigurator`
 * and `releaseConfigurator` methods.
 *
 * A 'changedConfigurator` event will be triggered that passes along the Configurator instance any time
 * a configurator changes.
 *
 * @exports VideoTemplateCoordinator
 */
export class VideoTemplateCoordinator extends EventEmitter {
    /**
     *
     * @param {object} options
     * @param {string} options.releaseConfiguratorTimeout The amount of time to delay a the release
     *                                                    of a configurator
     * @param {Boolean} options.isDebug Whether or not VideoTemplateCoordinator should run in debug
     *                                  mode.
     */
    constructor(options = {}) {
        super();

        /** @type {WaymarkAuthorConfigurator} */
        this.configurator = null;
        // Promise that awaits any loading configurator in case we get multiple calls to configure
        // but with no existing configurator.
        this.awaitingConfigurator = null;
        /** @type {VideoDescriptor | null} */
        this.videoDescriptor = null;
        // Keeps track of the current configurator update request in getConfigurator. Multiple
        // requests can be active in parallel so this ID is used to filter out all but the most
        // recent.
        this.configuratorUpdateID = 0;
        this.options = {
            releaseConfiguratorTimeout: 5000,
            isDebug: false,
            ...options,
        };
    }

    /**
     * Given an existing video spec and an incoming video spec, is a new Configurator required?
     *
     * @param {VideoDescriptor | null} oldVideoDescriptor
     * @param {VideoDescriptor} nextVideoDescriptor
     * @returns {boolean}
     */
    static shouldChangeConfigurator(oldVideoDescriptor, nextVideoDescriptor) {
        const hasExistingVideoSpec = Boolean(oldVideoDescriptor);
        return (!hasExistingVideoSpec ||
            oldVideoDescriptor.__templateSlug !== nextVideoDescriptor.__templateSlug
        );
    }

    /**
     * Given a videoSpec will get an instance of its associated Configurator.
     *
     * @param {VideoDescriptor} videoDescriptor
     * @param {object} studioPreviewOverrides
     *
     * @returns {Configurator}
     */
    static async getNewConfigurator(videoDescriptor, studioPreviewOverrides) {
        const ConfiguratorClass = await WaymarkAuthorBundleManager.createConfiguratorClass(
            videoDescriptor,
            studioPreviewOverrides,
        );

        return new ConfiguratorClass();
    }

    /**
     * Given an instance of a configurator, will unmount it if needed and then
     * destroy the configurator.
     */
    static async destroyConfigurator(configurator) {
        if (configurator.isMounted()) {
            await configurator.unmount();
        }
        await configurator.destroy();
    }

    /**
     * Given a VideoSpec, will return a Promise that will resolve with an instance
     * of a Configurator once the Configurator has been instantiated, set up, and
     * loaded with the VideoSpec's configuration.
     *
     * If a new configurator (differing from the VideoTemplateCoordnator's current configurator)
     * is required, a 'changedConfigurator` event will be triggered that passes along the Configurator instance.
     *
     * If `releaseConfigurator` was previously invoked and `options.releaseConfiguratorTimeout` number of milliseconds
     * has yet to pass, calling `getConfigurator` will cancel the release of the configurator. This optimizes for re-use
     * of configurators to hopefully lead to smoother playback for implementers of VideoTemplateCoordinator.
     *
     * @param {VideoDescriptor} newVideoDescriptor
     * @param {object | null} studioPreviewOverrides
     * @param {boolean} [shouldForceCreateNewConfigurator=false]
     *
     * @returns {Promise<Configurator>}
     */
    async getConfigurator(
        newVideoDescriptor,
        studioPreviewOverrides,
        shouldForceCreateNewConfigurator = false,
    ) {
        // Get the next update serial number for this request. Since multiple requests can be active and
        // waiting on various asynchronous operations within getConfigurator, we need to track and service
        // only the most recent request to avoid updates from earlier requests being performed after those
        // from later requests.
        const configuratorUpdateID = this.configuratorUpdateID + 1;
        this.configuratorUpdateID = configuratorUpdateID;

        if (_.isEmpty(newVideoDescriptor)) {
            this.consoleWarn('`getConfigurator` called with no videoDescriptor.');
            throw new Error('`getConfigurator` called with no videoDescriptor.');
        }

        // If there is a pending configurator release, cancel it.
        if (this.releaseConfiguratorTimeoutID) {
            this.consoleLog('Cancelling configurator release.', configuratorUpdateID);
            clearTimeout(this.releaseConfiguratorTimeoutID);
            this.releaseConfiguratorTimeoutID = null;
        }

        // Cache the old videoSpec for old/new comparisons.
        const oldVideoDescriptor = _.cloneDeep(this.videoDescriptor);
        // this.videoSpec will always be the video spec of the most recent call to getConfigurator.
        // Earlier calls can be active while waiting on asynchronous methods but we don't want
        // to ever use the video specs for those calls once we've moved on to a newer one.
        this.videoDescriptor = _.cloneDeep(newVideoDescriptor);

        // Ensure we have a configurator, change it if we need to
        if (
            shouldForceCreateNewConfigurator ||
            this.constructor.shouldChangeConfigurator(oldVideoDescriptor, newVideoDescriptor)
        ) {
            this.consoleLog(
                `Changing configurators from ${
          oldVideoDescriptor && oldVideoDescriptor.__templateSlug
        } to ${newVideoDescriptor.__templateSlug}.`,
                configuratorUpdateID,
            );
            const oldConfigurator = this.configurator;

            if (oldConfigurator) {
                await this.constructor.destroyConfigurator(oldConfigurator);
            }

            // Subsequent getConfigurator requests may come in while the new configurator
            // is loading. Since those may have updated configuration data we'll want to
            // be able to wait for the new configurator to load before doing the later
            // configurations. At that point the configuratorUpdateID checks will handle
            // versioning issues.
            this.awaitingConfigurator = this.constructor.getNewConfigurator(
                newVideoDescriptor,
                studioPreviewOverrides,
            );
            this.configurator = await this.awaitingConfigurator;
            this.awaitingConfigurator = null;

            this.emit('changedConfigurator', this.configurator);
        } else if (this.awaitingConfigurator) {
            // We're busy loading a new configurator from a previous call, which has the same
            // video spec. Let that call finish and configure it afterwards.
            await this.awaitingConfigurator;
        }

        // Now let's make sure the configurator is setup
        if (this.configurator.isSetupInProgress()) {
            this.consoleLog('Waiting for isSetup', configuratorUpdateID);
            try {
                await waitFor(() => this.configurator.isSetup());
                this.emit('configuratorSetup', this.configurator);
            } catch (error) {
                console.error('There was an error setting up the configurator.', error);
            }
            this.consoleLog('Done waiting for isSetup', configuratorUpdateID);
        } else if (!this.configurator.isSetup()) {
            this.consoleLog('Waiting for setup', configuratorUpdateID);
            await this.configurator.setup(this.videoDescriptor);
            this.consoleLog('Done waiting for setup, mounting', configuratorUpdateID);
            this.configurator.mount();
            this.consoleLog('Mounted for setup', configuratorUpdateID);
        }

        if (this.configuratorUpdateID !== configuratorUpdateID) {
            // Multiple requests to getConfigurator, kicked off by various component updates,
            // can be active During the above asynchronous calls. At this point we can cancel
            // this call if a later call has come in while this configuratorUpdateID call was
            // waiting.
            // TODO: At some point we will want to be able to tell a configurator to cancel
            //       current operations due to changes being made before those operations
            //       are complete.
            this.consoleWarn(
                'Rejecting after isSetup()/mount()',
                configuratorUpdateID,
                '( was ',
                this.configuratorUpdateID,
                ')',
            );

            throw new GetConfiguratorInterruptedException(
                'Call to getConfigurator() superceded by later call.',
            );
        }

        // At this point we should have a setup configurator for our slug
        // Let's wait for the configurator to finish loading a configuration before we proceed
        if (this.configurator.isLoadingConfiguration()) {
            this.consoleLog('Waiting for isLoadingConfiguartion', configuratorUpdateID);
            await waitFor(() => !this.configurator.isLoadingConfiguration());
            this.consoleLog('Done waiting for isLoadingConfiguration', configuratorUpdateID);
        }

        if (this.configuratorUpdateID !== configuratorUpdateID) {
            // Multiple requests to getConfigurator, kicked off by various component updates,
            // can be active During the above asynchronous calls. At this point we can cancel
            // this call if a later call has come in while this configuratorUpdateID call was
            // waiting.
            // TODO: At some point we will want to be able to tell a configurator to cancel
            //       current operations due to changes being made before those operations
            //       are complete.
            this.consoleWarn(
                'Rejecting after isLoadingConfiguration()',
                configuratorUpdateID,
                '( was ',
                this.configuratorUpdateID,
                ')',
            );
            throw new GetConfiguratorInterruptedException(
                'Call to getConfigurator() superceded by later call.',
            );
        }

        // If the configurations are the same, there's no need to load a new configuration
        if (_.isEqual(this.configurator.configuration, this.videoDescriptor.__activeConfiguration)) {
            this.consoleLog('Unchanged configuration', configuratorUpdateID);
            return this.configurator;
        }

        this.consoleLog('Loading new configuration.', configuratorUpdateID);
        return (
            this.configurator
            // Currently this cloneDeep is done to allow for `_.isEqual(this.configurator.configuration, this.videoSpec.configuration)`.
            // i.e. We don't want to change this.configurator.configuration when we assign a new value to this.videoSpec.
            .loadConfiguration(_.cloneDeep(this.videoDescriptor.__activeConfiguration))
            .then(() => {
                this.consoleLog('New configuration loaded.', configuratorUpdateID);
                return this.configurator;
            })
        );
    }

    /**
     * Calling this method signifies that a consumer no longer needs a coordinator
     * from VideoTemplateCoordinator. It will ultimately call `VideoTemplateCoordinator.destroy`.
     * To optimize for use-cases where a VideoTemplateCoordinator
     * instance is handed off from one component to another, the *actual* release of the configurator
     * is delayed for a time of `this.options.releaseConfiguratorTimeout`. If `getConfigurator` is
     * subsequently called, then the release will be canceled.
     */
    releaseConfigurator() {
        this.consoleLog('Queuing the release of the configurator.');
        this.releaseConfiguratorTimeoutID = setTimeout(() => {
            if (this.configurator) {
                this.consoleLog('Releasing the configurator.');
                this.constructor.destroyConfigurator(this.configurator);
                // Even though `destroyConfigurator` is an asynchronous process, we will immediately nullify the existing
                // 'configurator', 'videoSpec', and 'releaseConfiguratorTimeoutID) references because we would want a subsequent
                // `getConfigurator` calls to consider these objects "released".
                this.configurator = null;
                this.videoDescriptor = null;
                this.releaseConfiguratorTimeoutID = null;
            }
        }, this.options.releaseConfiguratorTimeout);
    }

    consoleWarn(...args) {
        if (this.options.isDebug) {
            console.warn('Video Template Coordinator:', ...args);
        }
    }

    consoleLog(...args) {
        if (this.options.isDebug) {
            /* eslint-disable-next-line no-console */
            console.log('Video Template Coordinator:', ...args);
        }
    }

    consoleError(...args) {
        if (this.options.isDebug) {
            console.error('Video Template Coordinator:', ...args);
        }
    }
}