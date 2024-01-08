import RuntimeConfig from 'shared/utils/RuntimeConfig.js';
import Faye from './faye.js';

// Enable logging for autofill and profile search push connections.
// Faye.logger.error = window.console.error;
// Force Faye to use websockets now that Fanout has turned off HTTP
Faye.MANDATORY_CONNECTION_TYPES = ['websocket'];

/**
 * Serves as a facade over the push service to hide whatever vendor we may use.
 *
 * Requires the configuration to be passed in the jinja file:
 *     'core/services/PushService': context_json.push_configuration,
 */
class PushService {
    constructor() {
        // TODO: change this to shared/services/PushService.
        this.config = RuntimeConfig.getConfig('core/services/PushService');

        if (this.config.fanout) {
            const fanoutEndpoint = `https://${this.config.fanout.realm_id}.fanoutcdn.com/bayeux`;
            this.fayeClient = new Faye.Client(fanoutEndpoint);
        }
    }

    /**
     * Subscribe to the given channel. 'callback' will be called with a single argument
     * containing the message data.
     *
     * The subscription should be saved if you wish to cancel it at some point:
     *     this.rhubarbSubscription = PushService.subscribe('global.rhubarb', (data) => console.log('Rhubarb: ' + data));
     *     this.rhubarbSubscription.cancel();
     *
     * This method will return a promise that may be used to discover when the subscription
     * has been established:
     *     this.rhubarbSubscription = PushService.subscribe('global.rhubarb', (data) => console.log('Rhubarb: ' + data));
     *     this.rhubarbSubscription.then(() => console.log('Rhubarb subscribed!'));
     *
     * @param {string} channel - The Bayeaux channel to subscribe to.
     * @param {function} callback - A function to call whenever the channel receives data.
     * @return {Faye.Subscription} The subscription, which can be canceled if desired.
     */
    subscribe(channel, callback) {
        let fayeChannel = channel;
        if (fayeChannel[0] !== '/') {
            console.warn(
                'A forward slash was prepended to the channel because it is required by Bayeux. Please change the configuration to use a forward slash.',
            );
            fayeChannel = `/${fayeChannel}`;
        }

        console.log('Subscribing to fanout channel', fayeChannel);
        return this.fayeClient.subscribe(fayeChannel, callback);
    }
}

export default new PushService();