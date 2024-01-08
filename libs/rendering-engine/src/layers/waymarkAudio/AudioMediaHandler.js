/* eslint-disable no-underscore-dangle */
import _ from 'lodash';
import {
    createHeldPromise,
    gainToVolume,
    getAudioContext,
    getBrowserInfo,
    isiOS,
    volumeToGain,
} from '../../utils/index.js';
import {
    globalAudioPool
} from '../../unlockAudio.js';

/**
 * Loads an array buffer from a url.
 *
 * TODO: Should this be in utilities?
 *
 * @param      {string}   url     The url
 * @returns     {Promise}  Promise that returns an arraybufffer of the audio
 */
const loadArrayBufferViaUrl = async (url) =>
    new Promise((resolve, reject) => {
        // Load the buffer from the URL.
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = () => {
            // Make sure we get a successful response back.
            const code = `${xhr.status}` [0];
            if (code !== '0' && code !== '2' && code !== '3') {
                reject(new Error(`Failed loading audio file ${url} with status: ${xhr.status}`));
            }

            resolve(xhr.response);
        };

        xhr.onerror = () => {
            reject(new Error(`Failed loading audio file ${url}`));
        };

        // Send the XHR wrapped in a try/catch for safety
        try {
            xhr.send();
        } catch (e) {
            xhr.onerror();
        }
    });

/**
 * Convert seconds to an estimated frame number.
 *
 * @param  {number} seconds   Seconds
 * @param  {number} framerate Framerate
 * @returns {number}           Estimated frame number
 */
// eslint-disable-next-line no-unused-vars
const secondsToFrameNumber = (seconds, framerate = 30) => Math.round(seconds * framerate);

/**
 * Convert a frame number to estimated seconds.
 *
 * @param  {number} frameNumber Frame number
 * @param  {number} framerate   Framerate
 * @returns {number}             Estimated seconds
 */
const frameNumberToSeconds = (frameNumber, framerate = 30) => frameNumber / framerate;

/**
 * Abstract the audio object into a generic interface for connivence. This
 * interface will not initialize an audio object until play() has been called
 * once.
 *
 * Methods: play() stop() seekToFrame(position) mute() unmute()
 *
 * Attributes: duration src isLoaded isLoading isPlaying position src volume masterVolume
 *
 * @class      AudioMediaHandler (name)
 */
export default class AudioMediaHandler {
    constructor(resource, renderer, options) {
        this.setOptions(options);
        this.setResource(resource);

        // If an audio node wasn't passed, throw an error because the audio
        //  won't be connected to the renderer master node, and mute and volume changes there wont affect it
        if (!renderer) {
            throw Error('renderer not passed to AudioMediaHandler');
        }
        this.renderer = renderer;
        // eslint-disable-next-line no-underscore-dangle
        this.masterAudioNode = this.renderer._masterAudioNode;

        this._buffer = null;
        this._sourceObject = null;
        this._mediaSourceNode = null;
        this._isLoaded = false;
        this._isUnplayable = false;
        this._isPlaying = false;
        this._isLoading = false;
        this._isLocked = isiOS();
        this._contextPlayStart = 0.0;
        this._audioPlayStart = 0.0;
        this._playbackRate = this.options.defaultPlaybackRate || 1.0;
        this._isDestroyed = false;

        this.renderer._audioMediaHandlers.push(this);

        this.createAudioContextObjects();
    }

    createAudioContextObjects() {
        // Create/fetch a new context
        this._audioContext = getAudioContext();

        // Create a gain node modification for muting volume
        this._muteGainNode = this._audioContext.createGain();
        // Create a gain node modification for the master volume
        this._masterVolumeGainNode = this._audioContext.createGain();
        // Create a gain node for volume modification
        this._volumeGainNode = this._audioContext.createGain();

        // We have to hook up the nodes in this order:
        // [sourceNode] => [muteNode] => [masterVolumeGainNode] => [volumeGainNode] => [masterAudioNode] => [destination]
        this._muteGainNode.connect(this._masterVolumeGainNode);
        // Connect the master volume gain node to the volume node
        this._masterVolumeGainNode.connect(this._volumeGainNode);
        // Finally, connect the volume gain node to the master gain node
        this._volumeGainNode.connect(this.masterAudioNode);

        if (this.options.shouldUseMediaElement) {
            if (!this._audioElement) {
                this._audioElement = this.createAudioElement();
            }
            this._mediaSourceNode = this._audioContext.createMediaElementSource(this._audioElement);
            this._mediaSourceNode.connect(this._muteGainNode);
        }
    }

    /**
     * Creates an audio element for this AudioMediaHandler
     *
     * @returns     {HTMLAudioElement} Created autio element
     */
    createAudioElement() {
        let audioElement = globalAudioPool.claimAudioElement();
        if (!audioElement) {
            audioElement = document.createElement('audio');
            console.error(
                'Unable to find an unlocked audio element, this element may need to be unlock.',
            );
        }
        audioElement.setAttribute('playsinline', '');
        audioElement.setAttribute('preload', 'auto');
        audioElement.setAttribute('crossorigin', 'anonymous');
        // Disable the iOS control center media widget
        audioElement.setAttribute('x-webkit-airplay', 'deny');
        audioElement.setAttribute('src', this.src);
        return audioElement;
    }

    setResource(resource) {
        const incomingSrc = resource.data.src;
        // If an audio file is present but failed to load via the asset loader,
        // Don't attempt to play it
        if (!incomingSrc) {
            this._isUnplayable = true;
            return;
        }

        if (this._src !== incomingSrc) {
            this._isLoaded = false;
        }
        this._src = incomingSrc;

        // Only set this._audioElement.src if it's something else.
        // Setting HTMLMediaElement.src triggers a reload event,
        // even if it's set to the same value.
        if (this._audioElement && !this._isLoaded && this._audioElement.src !== this._src) {
            this._audioElement.src = this._src;
        }
    }

    /**
     * Sets the options related to AudioMediaHandler.
     *
     * If used in conjunction with `setResource`, be sure to call `setOptions` first.
     * @param {*} options
     */
    setOptions(options) {
        this.options = {
            defaultPlaybackRate: 1.0,
            mediaElement: null,
            shouldUseMediaElement: false,
            ...options,
        };

        if (this.options.mediaElement) {
            this.options.shouldUseMediaElement = true;
            this._audioElement = this.options.mediaElement;
        }
    }

    /**
     * Load the audioElement
     *
     * @returns {Promise} A Promise that the video will load
     */
    async loadElement() {
        const executor = (resolve, reject) => {
            this._audioElement.addEventListener('loadeddata', () => {
                // The audio is not fully loaded until the data is decoded
                this._isLoaded = true;
                this._isLoading = false;
                return resolve(this._audioElement);
            });
            this._audioElement.addEventListener('error', reject);
            return this._audioElement.load();
        };
        return new Promise(executor.bind(this));
    }

    /**
     * Callback method for when our audio bufferarray has been decoded by the audio context
     *
     * @private
     * @param      {AudioBuffer}  buffer  The buffer
     */
    onDecodeData(buffer) {
        this._buffer = buffer;
        // The audio is not fully loaded until the data is decoded
        this._isLoaded = true;
        this._isLoading = false;
    }

    /**
     * @private
     * @param {*} error Error when attempting to decode audio via an arraybuffer
     */
    onDecodeDataError(error) {
        this._isLoading = false;
        throw Error(`Error Decoding Audio Data for ${this.src}: ${error}`);
    }

    // NOTE: We may be able to eliminate the load call in the media handlers because of the `preload` attribute
    async _load() {
        if (this._isLoaded) {
            return;
        }
        this._isLoading = true;
        // If a media element is passed in and it is not loaded, we are assuming
        // It is being loaded by the original element creator (i.e. the VideoMediaHandler)
        if (this.options.mediaElement) {
            // Mark it as loaded for our record-keeping
            if (this._audioElement.readyState >= 2) {
                this._isLoading = false;
                this._isLoaded = true;
                this._isLocked = false;
            }
        } else if (this._audioElement) {
            try {
                await this.loadElement();
            } catch (error) {
                this._isLoading = false;
                throw Error(`Error loading Audio Data for ${this.src}: ${error}`);
            }
        } else {
            this._sourceObject = await loadArrayBufferViaUrl(this.src);
            // Decode the buffer into an audio source.
            const decodingPromise = new Promise((resolve, reject) => {
                this._audioContext.decodeAudioData(this._sourceObject, resolve, reject);
            });
            try {
                const buffer = await decodingPromise;
                this.onDecodeData(buffer);
            } catch (e) {
                this.onDecodeDataError(e);
            }
        }
    }

    /**
     * Audio src
     *
     * @returns  {string}  Audio src
     */
    get src() {
        return this._src;
    }

    /**
     * Audio duration in seconds
     *
     * @returns  {number}  Audio duration
     */
    get duration() {
        if (!this._buffer) {
            // Audio element needs to be initalized to determine duration
            return Math.Infinity;
        }

        return this._buffer.duration;
    }

    /**
     * Is audio loaded
     *
     * @returns  {boolean}  Is audio loaded
     */
    get isLoaded() {
        return this._isLoaded;
    }

    /**
     * Is the audio locked (iOS require user interaction to unloack audio)
     *
     * @returns  {boolean}  Is audio locked
     */
    get isLocked() {
        return this._isLocked;
    }

    /**
     * Is audio playing
     *
     * @returns  {boolean}  Is audio playing
     */
    get isPlaying() {
        return this._isPlaying;
    }

    get masterVolume() {
        return gainToVolume(this._masterVolumeGainNode.gain.value);
    }

    set masterVolume(value) {
        this._masterVolumeGainNode.gain.value = volumeToGain(value);
    }

    get volume() {
        // TODO: Fix the gainToVolume function to properly account for 0
        return this._volumeGainNode.gain.value === 0 ?
            0 :
            gainToVolume(this._volumeGainNode.gain.value);
    }

    set volume(value) {
        // TODO: Fix the volumeToGain function to properly account for 0
        this._volumeGainNode.gain.value = !value ? 0 : volumeToGain(value);
    }

    get isMuted() {
        return !this._muteGainNode.gain.value;
    }

    get playbackRate() {
        return this._playbackRate;
    }

    set playbackRate(playbackRate) {
        this._playbackRate = playbackRate;
    }

    /**
     * Handles the actual setting of playbackrate on the media element
     *
     * @param {number} rate  The playbackrate of the media element
     */
    setMediaPlaybackRate(rate) {
        // Safari doesn't handle playback rate changes very gracefully
        if (['safari', 'ios'].includes(getBrowserInfo().browserName)) {
            return;
        }
        if (this._audioBufferSource) {
            this._audioBufferSource.playbackRate.value = rate;
        }
        if (this.options.shouldUseMediaElement && !this.options.mediaElement) {
            this._audioElement.playbackRate = rate;
        }
    }

    /**
     * Mute audio
     */
    mute() {
        this._muteGainNode.gain.value = 0;
    }

    /**
     * Unmute audio
     */
    unmute() {
        this._muteGainNode.gain.value = 1;
    }

    /**
     * Get's the current time in seconds that have elapsed in the audio track
     * used to track the time during playback
     *
     * @type       {number}
     */
    get currentTime() {
        if (!this.isLoaded) {
            return 0;
        }
        if (this._audioElement) {
            return this._audioElement.currentTime;
        }

        const elapsedTime = this._isPlaying ?
            this._audioContext.currentTime - this._contextPlayStart :
            0.0;
        return Math.min(this._audioPlayStart + elapsedTime, this.duration);
    }

    /**
     * Stop the audio
     * TODO: Make async so we can await the loading process
     */
    stop() {
        // If we hit stop before the load is complete we can sometime run into a race condition
        // where it attempts to play a loading audio buffer source. Set a state so we can close it
        if (this._isLoading) {
            this._shouldStopOnLoad = true;
        }
        if (this._isUnplayable || !this._isLoaded) {
            return;
        } else if (this.options.shouldUseMediaElement && !this.options.mediaElement) {
            this._audioElement.pause();
        } else if (this._audioBufferSource) {
            this._audioBufferSource.stop();
            this._audioBufferSource.disconnect();
            delete this._audioBufferSource;
        }

        this._isPlaying = false;
    }

    /**
     * Play audio
     */
    async play() {
        if (this._isUnplayable || this._isPlaying || this.renderer.isMuted) {
            return;
        }

        // We can only load audio on play events outside of iOS
        if (!this._isLoaded && !isiOS()) {
            try {
                await this.load();
            } catch (error) {
                this._isUnplayable = true;
                console.error('AudioMediaHandler unable to load audio:', error);
                return;
            }
        }

        if (this._shouldStopOnLoad) {
            this._shouldStopOnLoad = false;
            return;
        }

        // If the audio context has been suspended, we should restart it.
        if (this._audioContext.state === 'suspended') {
            try {
                await this._audioContext.resume();
            } catch (error) {
                console.error('play was unable to resume audio context', error);
            }
        }
        this.setMediaPlaybackRate(this.playbackRate);
        if (this.options.shouldUseMediaElement && !this.options.mediaElement) {
            // NOTE: We're making the assumption that setting current time on audio is a lot faster
            //       than video media elements and is virtually synchronous.
            // TODO: In the future, we should wait to resolve this until it has loaded the audio at the time
            //       before attempting a play
            this._audioElement.currentTime = this._audioPlayStart;
            try {
                await this._audioElement.play();
            } catch (error) {
                if (error.message.includes('The request is not allowed by the user agent')) {
                    console.error(`AudioMediaHandler for ${this._src} Playback Error:`, error);
                    this._isLocked = true;
                    return;
                }
            }
        } else {
            /**
             * A Buffer Source can only be used once for playing audio, so on every stop/start
             * we must recreate it and connect it to our nodes
             *
             * https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
             */
            this._audioBufferSource = this._audioContext.createBufferSource();
            this._audioBufferSource.buffer = this._buffer;

            // Connect the buffer source to the first node in our chain (the muteGainNode)
            // This is important! It needs to be connected so the new source can go to the destination
            this._audioBufferSource.connect(this._muteGainNode);

            this._contextPlayStart = this._audioContext.currentTime;
            this._audioBufferSource.start(0.0, this._audioPlayStart);
        }
        this._isPlaying = true;
    }

    /**
     * Seek to position in frame numbers
     *
     * @param {number} frameNumber The frame number to seek to
     * @returns {Promise} Promise that resolves when the audio has seeked to the correct frame
     */
    async seekToFrame(frameNumber) {
        if (this._isUnplayable) {
            return;
        }

        // Safari Bug: target time can't be less than 0
        const desiredTime = Math.max(frameNumberToSeconds(frameNumber), 0);

        // If we're not actively playing, just update the current time
        if (!this.isLoaded || !this.isPlaying) {
            this._audioPlayStart = desiredTime;
            // If we are over the duration, pause and go to the end
        } else if (desiredTime > this.duration) {
            this.stop();
            this._audioPlayStart = this.duration;
            // If it's currently playing and the time difference is more than 1 second, seek to position
        } else if (this.isPlaying && Math.abs(desiredTime - this.currentTime) >= 1.0) {
            this._audioPlayStart = desiredTime;
            if (this.options.shouldUseMediaElement && !this.options.mediaElement) {
                // NOTE: We're making the assumption that setting current time on audio is a lot faster
                //       than video media elements and is virtually synchronous.
                // TODO: In the future, we should wait to resolve this until the audio has been successfully seeked
                this._audioElement.currentTime = this._audioPlayStart;
            } else {
                this.stop();
                this._audioPlayStart = desiredTime;
                // eslint-disable-next-line consistent-return
                return this.play();
            }
        }
    }

    /**
     * Destroys the object and disconnects its nodes
     */
    destroy() {
        this.stop();
        _.pull(this.renderer._audioMediaHandlers, this);
        // Don't attempt to disconnect nodes that might not exist
        if (!this._isDestroyed) {
            if (this.audioElement) {
                globalAudioPool.releaseAudioElement(this.audioElement);
                this.audioElement = null;
            }
            if (this._volumeGainNode && this._volumeGainNode.numberOfOutputs) {
                this._volumeGainNode.disconnect();
            }
            if (this._masterVolumeGainNode && this._masterVolumeGainNode.numberOfOutputs) {
                this._masterVolumeGainNode.disconnect();
            }
            if (this._muteGainNode && this._muteGainNode.numberOfOutputs) {
                this._muteGainNode.disconnect();
            }
            if (this._mediaSourcenode && this._mediaSourcenode.numberOfOutputs) {
                this._mediaSourcenode.disconnect();
            }
            this._isDestroyed = true;
        }
    }
}

createHeldPromise(AudioMediaHandler, '_load', 'load');