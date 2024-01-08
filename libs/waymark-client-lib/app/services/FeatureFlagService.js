// Vendor
import {
    createInstance
} from '@optimizely/react-sdk';

// Local
import RuntimeConfig from 'shared/utils/RuntimeConfig.js';

/**
 * Singleton helper for using feature flags.
 * Currently we are using Optimizely Rollouts. We're providing the configuration datafile
 * from the back end to allow immediate rendering of UI features that are enabled, but also
 * enabling the Optimizely client to refresh itself occasionally.
 *
 * NOTE: Relies on the inclusion of the Optimizely Rollouts datafile in our RuntimeConfig.
 */
class FeatureFlagService {
    constructor() {
        const configuration = RuntimeConfig.getConfig('feature_flags');
        this.setConfigurationFile(configuration.optimizely_datafile);
    }

    setConfigurationFile(newConfiguration) {
        this.client = createInstance({
            // TODO: Including the SDK key allows the client to refresh itself, but it also
            //       allows the browser to cache the results so that it takes a bit for a
            //       feature's status to change. We may be able to use the datafileOptions
            //       urlTemplate setting to include a cache buster on the URL.
            //       See: https://docs.developers.optimizely.com/rollouts/docs/initialize-sdk
            // sdkKey: configuration.optimizely_sdk_key,
            datafile: newConfiguration,
            datafileOptions: {
                autoUpdate: true,
                updateInterval: 10 * 60 * 1000,
            },
        });
    }

    /**
     * Test a particular feature to see if it's enabled.
     *
     * @param  {string} featureKey The key used to identify the feature.
     * @param  {string} userKey The unique key for this user. Needs to be the same as the key
                                used on the server. This will override any user set with setUser,
                                and is REQUIRED if setUserAndAttributes has not been called.
     * @param  {object} userAttributes  { email } Audience attributes for the user. This will
                                                  override any attributes set with setUser.
     * @return {Boolean} Whether or not the feature is enabled for this user.
     */
    isFeatureEnabled(featureKey, ...args) {
        return this.client.isFeatureEnabled(featureKey, ...args);
    }

    /**
     * Set the user and attributes for the entire session.
     *
     * @param  {string} userKey The unique key for this user. Needs to be the same as the key
                                used on the server.
     * @param {object} attributes User audience attributes.
     * @param {String} attributes.email User email address.
     */
    setUserAndAttributes(userKey, attributes) {
        const userData = {
            id: userKey,
            attributes,
        };

        this.client.setUser(userData);
    }
}

export default new FeatureFlagService();