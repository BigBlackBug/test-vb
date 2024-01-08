/* eslint-disable no-underscore-dangle */
// Vendor
import {
    detect
} from 'detect-browser';
import _ from 'lodash';
import {
    BaseTexture,
    Rectangle,
    Sprite,
    Texture
} from 'pixi.js';

// Local
import {
    AudioMediaHandler
} from '../waymarkAudio/index.js';
import {
    seekVideoToFrame
} from './utils.js';
import settings, {
    timeSyncVideoSeekMode
} from '../../settings.js';
import {
    defaultVideoMediaModifications,
    prepareTextureFit
} from '../utils/index.js';

let browserName;
let browserOS;
const browserInfo = detect();
// On node platforms browserInfo will return back null
if (browserInfo) {
    ({
        name: browserName,
        os: browserOS
    } = browserInfo);
}

// How many frames should we spend measuring to determine whether the playbackRate needs to change
const FRAME_OFFSET_MEASUREMENT_COUNT = 3;

// This is the porportion of the default playbackRate that we can adjust by while trying to sync the video
// to the timeline. Higher values of this may result in audio popping or stuttering in Chrome.
const MAX_PLAYBACK_RATE_ADJUSTMENT_PROPORTION = 0.1;

const PLAYBACK_SYNC_STEP = {
    polling: 'polling',
    measuring: 'measuring',
    adjusting: 'adjusting',
    seeking: 'seeking',
    // abortedBySubsequentSeekToTime and abortedBySubsequentSyncToFrame are special cases that are
    // returned from syncToFrame when syncToFrame is interruped by a subsequent seek. syncToFrame will
    // immediately follow up with a 'polling' step, or a 'seeking' step if the subsequent seek was
    // triggered by a subsequent syncToFrame call.
    abortedBySubsequentSeekToTime: 'abortedBySubsequentSeekToTime',
    abortedBySubsequentSyncToFrame: 'abortedBySubsequentSyncToFrame',
};

// Limit playbackRate to the range (0.25, 2.0)
// Chrome and Firefox automatically limit the playback rate to (0.0625, 16.0),
// but Safari doesn't appear to handle rates other than 1.0 very well.
// https://stackoverflow.com/a/32320020
const PLAYBACK_SYNC_MINIMUM = 0.25;
const PLAYBACK_SYNC_MAXIMUM = 2.0;

// Limit playbackRate to the range (+/- 0.1) for the first 3000ms.
// This limits audio distortion when the video begins playing, because videos frequently begin
// several frames late, which can trigger a significant playbackRate change.
const INITIAL_PLAYBACK_SYNC_DURATION = 3000;
const INITIAL_PLAYBACK_SYNC_RANGE = 0.1;

/**
 * Return a constrained playback rate based on the allowed limits
 *
 * @param      {number}  rate    The rate
 * @returns     {number} The constrained playback rate
 */
const constrainPlaybackRate = (rate) =>
    Math.min(PLAYBACK_SYNC_MAXIMUM, Math.max(PLAYBACK_SYNC_MINIMUM, rate));

/**
 * Return a constrained playback rate based on the allowed limits
 *
 * @param      {number}  rate    The default playback rate of the video element
 * @param {number} currentPlaybackRate The current playback rate of the video element
 * @returns     {number} The constrained playback rate
 */
const constrainInitialPlaybackRate = (rate, currentPlaybackRate) =>
    Math.min(
        currentPlaybackRate + INITIAL_PLAYBACK_SYNC_RANGE,
        Math.max(currentPlaybackRate - INITIAL_PLAYBACK_SYNC_RANGE, rate),
    );

const SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO = !['safari', 'ios'].includes(browserName);

/**
 * Estimated frame number offsets for common browsers.
 */
const browserVideoPlaybackOffsets = [{
        // Chrome desktop
        browsers: [{
                name: 'chrome',
                os: 'Mac OS',
            },
            {
                name: 'chrome',
                os: 'Windows 10',
            },
        ],
        offset: -1.0,
    },
    // Safari desktop and mobile
    {
        browsers: [{
                name: 'ios',
                os: 'iOS',
            },
            {
                name: 'safari',
                os: 'Mac OS',
            },
        ],
        offset: -0.4,
    },
    // Firefox desktop
    {
        browsers: [{
                name: 'firefox',
                os: 'Mac OS',
            },
            {
                name: 'firefox',
                os: 'Windows 10',
            },
        ],
        offset: 0.1,
    },
];

/**
 * Get the offset for the current browser.
 *
 * @returns {number} The seconds off a browser will report its current play position
 */
const getOffset = () => {
    const playbackOffset = browserVideoPlaybackOffsets.find(({
            browsers
        }) =>
        browsers.find(({
            name,
            os
        }) => name === browserName && os === browserOS),
    );

    const offset = playbackOffset ? playbackOffset.offset : 0.0;
    return offset;
};

/**
 * Convert seconds to an estimated frame number.
 *
 * @param  {number} seconds   Seconds
 * @param  {number} framerate Framerate
 * @param  {boolean} isPlaying If the video is currently playing
 * @returns {number}           Estimated frame number
 */
const secondsToFrameNumber = (seconds, framerate, isPlaying = false) => {
    // Apply an offset if the video is currently playing.
    // (Some browser's reported frame number is slightly off during playback)
    const offset = isPlaying ? 0 : getOffset();
    const frameNumber = Math.round(seconds * framerate + offset);
    return frameNumber;
};

/**
 * Convert a frame number to estimated seconds.
 *
 * @param  {number} frameNumber Frame number
 * @param  {number} framerate   Framerate
 * @returns {number}             Estimated seconds
 */
const frameNumberToSeconds = (frameNumber, framerate) => {
    if (frameNumber === 0) {
        // Don't apply an offset for the first frame of the video
        return 0.0;
    }

    const offset = getOffset();
    const seconds = (frameNumber - offset) / framerate;
    return seconds;
};

const roundSeekTime = (time) => Number(time.toFixed(3));

export class SeekToTimeError extends Error {
    constructor(code) {
        super(`VideoMediaHandler seek to time error: ${code}`);
        this.code = code;
    }
}

export class PlayError extends Error {
    constructor(code) {
        super(`VideoMediaHandler play error: ${code}`);
        this.code = code;
    }
}

export const seekToTimeResult = {
    success: 'success',
    timeout: 'timeout',
    abortedBySubsequentSeek: 'abortedBySubsequentSeek',
    abortedVideoNotLoaded: 'abortedVideoNotLoaded',
    playError: 'playError',
};

export const playResult = {
    success: 'success',
    timeout: 'timeout',
    abortedByActivePlayingRequest: 'abortedByActivePlayingRequest',
    abortedVideoNotLoaded: 'abortedVideoNotLoaded',
    abortedBySeekToTimeRequest: 'abortedBySeekToTimeRequest',
};

/**
 * A wrapper around a video element.
 *
 * Top-level features:
 * - Promised-based seekToTime, so that you know when a seek has succeeded
 * - Ability to tell if a video has been fully buffered
 * - Promise-based loading of a video (ideally it resolves once our minimum amount of
 * data we require is fetched, that feature is ongoing)
 *
 * Note: This is modified from the ConfiguratorVideo.coffee found in ivory:
 * - New: `syncToFrame` method for real time video frame syncing
 * - Update: `seekToTime` method has different verification and delay steps
 */
export class VideoMediaHandler {
    constructor(resource, renderer, modifications = {}, options = {}) {
        this.onVideoSeeked = this.onVideoSeeked.bind(this);
        this.onVideoTimeUpdated = this.onVideoTimeUpdated.bind(this);
        this.onVideoEndUpdated = this.onVideoEndUpdated.bind(this);

        this.setResource(resource);
        this.renderer = renderer;

        this.hasTimecode = false;
        this.shouldUseTimecode = false;
        this.scaledTimecodeSettings = null;
        this.timecodeSettings = null;
        this.mostRecentSeekToFrameResult = null;

        this.setModifications(modifications);
        this.setOptions(options);

        this.isLoaded = false;
        this.isVideoStoppedByVideoMediaHandler = false;
        this.isVideoStoppedExternally = false;
        this.checkUpdateIntervalTimeout = null;
        this.videoElement = this.createVideoElement();
        this.texture = null;
        this.baseTexture = null;
        this.audioMediaHandler = null;
        this._duration = null;

        const isAccurateTimeSyncMode =
            settings.TIME_SYNC_VIDEO_SEEK_MODE === timeSyncVideoSeekMode.accurate;

        if (isAccurateTimeSyncMode && !this.hasTimecode) {
            console.warn(
                'Renderer is currently operating on accurate timesync mode without a timecode. Videos may not render frame-accurately',
            );
        }

        this.timecodeTexture = null;
        this.timecodeSprite = null;

        this.startAdjustmentTime = null;
        this.frameOffsets = [];
        this.playbackSyncStep = PLAYBACK_SYNC_STEP.polling;
        this.latestSeekToTimeCode = null;
        this.latestSyncToFrameSeekToTimeCode = null;

        this.totalFramesElapsed = 0;
        this.totalFramesAdjusted = 0;
        this.totalTimesAdjusted = 0;

        this.onPlayStartTime = 0;

        this.lastUpdateTimeForInterval = performance.now();
        this.setupVideoSeeking();
        this.setupVideoTimeUpdates();
        this.setupVideoEndUpdates();
        this.beginVideoIsNotUpdatingLoop();
    }

    /**
     * Initialize videoIsNotUpdating event loop. This will cause a videoIsNotUpdating
     * event to dispatch for every videoIsNotUpdatingInterval when the video has not
     * received an update. This is useful for reliably determining that a recently
     * paused video is done receiving updates, as pausing is an asynchronous process
     * and it may allow a few frames to buffer after it is triggered.
     */
    beginVideoIsNotUpdatingLoop() {
        const event = new Event('videoIsNotUpdating');

        const onCheckUpdateInterval = () => {
            const currentTime = performance.now();
            if (currentTime - this.lastUpdateTimeForInterval >= this.options.videoIsNotUpdatingInterval) {
                this.videoElement.dispatchEvent(event);
                this.lastUpdateTimeForInterval = performance.now();
            }
        };

        this.checkUpdateInterval = setInterval(onCheckUpdateInterval, 50);
    }

    setupVideoSeeking() {
        this.videoSeekingListeners = [];
        this.videoElement.addEventListener('seeked', this.onVideoSeeked);
    }

    teardownVideoSeeking() {
        this.videoElement.removeEventListener('seeked', this.onVideoSeeked);
    }

    setupVideoTimeUpdates() {
        this.videoTimeUpdateListeners = [];
        this.videoElement.addEventListener('timeupdate', this.onVideoTimeUpdated);
    }

    teardownVideoTimeUpdates() {
        this.videoElement.removeEventListener('timeupdate', this.onVideoTimeUpdated);
    }

    setupVideoEndUpdates() {
        this.videoEndUpdateListeners = [];
        this.videoElement.addEventListener('videoIsNotUpdating', this.onVideoEndUpdated);
    }

    teardownVideoEndUpdates() {
        this.videoElement.removeEventListener('videoIsNotUpdating', this.onVideoEndUpdated);

        if (this.checkUpdateInterval) {
            clearInterval(this.checkUpdateInterval);
        }
    }

    // you need to call setup
    setResource(resource) {
        if (this.resource && this.resource.url !== resource.url) {
            this.isLoaded = false;
        }
        this.resource = resource;
        if (this.videoElement && !this.isLoaded) {
            this.videoElement.setAttribute('src', this.resource.url);
        }
    }

    // you need to call setup
    setModifications(modifications) {
        this.modifications = modifications;
        this.hasTimecode = _.get(this.modifications, 'hasTimecode', false);
        this.shouldUseTimecode = _.get(this.modifications, 'shouldUseTimecode', false);

        this.assetHeightPadding =
            _.get(this.modifications, 'videoAssetHeightMode', 'assetOnly') === 'assetWithPadding' ?
            this.modifications.videoAssetHeightPadding :
            0;

        if (this.hasTimecode) {
            if (!_.has(this.modifications, 'timecodeSettings')) {
                throw new Error(
                    'modifications.timecodeSettings required when modifications.hasTimecode is true',
                );
            }

            this.timecodeSettings = this.modifications.timecodeSettings;

            if (!_.has(this.modifications, 'timecodeScaleMode')) {
                throw new Error(
                    'modifications.timecodeScaleMode required when modifications.hasTimecode is true',
                );
            }

            // TODO: Remove timecodeScaleMode when waymarkTemplateStudio assets are
            // phased out (all timecodes will be `fixed`)
            this.timecodeScaleMode = this.modifications.timecodeScaleMode;
        } else {
            this.timecodeSettings = null;
        }

        this.scaledTimecodeSettings = null;
    }

    // you need to call setup
    setOptions(options) {
        if (!(options.assetWidth && options.assetHeight)) {
            console.warn(
                'No asset height or width dimension was provided when setting up VideoMediaHandler, defaulting to 1920x1080',
            );
        }

        if (!(options.displayWidth && options.displayHeight)) {
            console.warn(
                'No display height or width dimension was provided when setting up VideoMediaHandler, defaulting to 1920x1080',
            );
        }

        this.options = {
            framerate: 30,
            playTimeout: 10000,
            seekToTimeTimeout: 10000,
            // Wait 70ms before assuming that the video is done updating after a pause/stop request.
            // This is enough for two frames at 30fps (33.3ms * 2). This value can be increased if we
            // encounter video updates more than two frames after a pause event.
            videoIsNotUpdatingInterval: 70,
            // The original (master) asset's size
            assetWidth: 1920,
            assetHeight: 1098,
            // The displayed size of the video layer in the template
            displayWidth: 1920,
            displayHeight: 1080,
            // The playback rate we should expect for the start of this video playback
            defaultPlaybackRate: 1.0,
            ...options,
        };

        // eslint-disable-next-line no-underscore-dangle
        this._playbackRate = this.options.defaultPlaybackRate || 1.0;
    }

    createVideoElement() {
        const videoElement = document.createElement('video');
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('preload', '');
        videoElement.setAttribute('crossorigin', 'anonymous');
        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO) {
            videoElement.volume = 0;
            videoElement.muted = true;
        }
        videoElement.setAttribute('src', this.resource.url);
        return videoElement;
    }

    /**
     * Load the videoElement
     * NOTE: We may be able to eliminate the load call in the media handlers
     *
     * @returns {Promise} A Promise that the video will load
     */
    async loadElement() {
        // Reset the duration before loading
        this._duration = null;
        const executor = (resolve, reject) => {
            this.videoElement.addEventListener('loadeddata', (event) => {
                this.isLoaded = true;
                // We are caching the duration because (a) it will be available at this moment and (b)
                // there is currently an unknown reason that videoElement.duration could return NaN at a later time.
                // This was discovered while debugging a unit test and we didn't get to the bottom of it. We attempted
                // to monitor the value of .duration after events like "loadedmetadata" "progress" "clear" etc. and
                // could not find *when* duration went from a Number to NaN in our codebase. It could (?) be due to
                // another`.load` getting called from somewhere (maybe in the audio unlock?). It remains a mystery for now.
                this._duration = event.target.duration;
                return resolve(this.videoElement);
            });
            this.videoElement.addEventListener('error', reject);
            return this.videoElement.load();
        };
        return new Promise(executor.bind(this));
    }

    async setup() {
        if (!this.isLoaded) {
            await this.loadElement();
        }

        const audioMediaHandlerOptions = {
            defaultPlaybackRate: this.options.defaultPlaybackRate,
            shouldUseMediaElement: true,
            mediaElement: SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO ? this.videoElement : null,
        };
        if (this.audioMediaHandler) {
            this.audioMediaHandler.setOptions(audioMediaHandlerOptions);
            this.audioMediaHandler.setResource(this.resource);
        } else {
            this.audioMediaHandler = new AudioMediaHandler(
                this.resource,
                this.renderer,
                audioMediaHandlerOptions,
            );
        }

        // NOTE: We have to make sure the iOS isn't loading now, as that would cause audio to lock (loading without user interaction)
        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO && browserOS !== 'iOS') {
            await this.audioMediaHandler.load();
        }

        const options = {
            resourceOptions: {
                autoPlay: false
            }
        };
        this.baseTexture = BaseTexture.from(this.videoElement, options);

        let masterAssetDimensions;

        // TODO: Remove timecodeScaleMode when waymarkTemplateStudio assets are
        // phased out (all timecodes will be `fixed`)
        if (this.hasTimecode && this.timecodeScaleMode === 'fixed') {
            const {
                timecodeDigitWidth: unscaledTimecodeDigitWidth,
                timecodeDigitHeight: unscaledTimecodeHeight,
            } = this.timecodeSettings;

            const unscaledTimecodePaddingTop =
                'timecodePaddingTop' in this.timecodeSettings ?
                this.timecodeSettings.timecodePaddingTop :
                0;

            const {
                height: unscaledVideoHeightWithTimecodeAndPadding,
                width: unscaledVideoWidth
            } =
            this.baseTexture;

            const unscaledVideoHeight =
                unscaledVideoHeightWithTimecodeAndPadding -
                unscaledTimecodeHeight -
                unscaledTimecodePaddingTop;

            // Calculate the target master asset video height.
            // Note that the asset dimensions provided to this.options represent
            // the height of the asset with a fixed-size timecode.
            // The unscaled texture also has a timecode of identical height.
            //
            // Example values for a 1080p timecode video with a 720p scaled asset:
            // defaultTimecodeSettings.timecodeDigitHeight === 18 (18px timecode)
            // this.options.assetHeight === 1098 (1080px + 18px timecode)
            // this.baseTexture.height === 738 (720px + 18px timecode)
            //
            // And the resultant calculations:
            // unscaledVideoHeight === 1080 (1098 - 18)
            // unscaledVideoWidth === 1920
            // verticalVideoScale === 1.5 (1080 / 720)
            // scaledTimecodeHeight === 27 (18 * 1.5)
            // scaledTextureHeight === 1107 (1080 + 27)

            // assetHeight might, for old video files, represent the height of the
            // video plus the height of a legacy timecode.
            // Therefore options.assetHeight can have a separate `padding` that
            // determines how many pixels, if any, must be trimmed from the bottom
            // to calculate the true height of the video.
            //
            // `assetHeightPadding` and `timecodeSettings.timecodePaddingTop`
            // represent the same value by default: the height of a legacy timecode.
            // Either of these values can be manually adjusted on a per-template basis
            // if we encounter a pre-vps template with an atypical timecode size or
            // atypical asset height value.
            const {
                assetHeight: masterAssetHeightWithPadding,
                assetWidth: masterAssetWidth
            } =
            this.options;
            const masterAssetHeight = masterAssetHeightWithPadding - this.assetHeightPadding;

            const verticalVideoScale = masterAssetHeight / unscaledVideoHeight;
            const horizontalVideoScale = masterAssetWidth / unscaledVideoWidth;

            const scaledTextureWidth = Math.round(unscaledVideoWidth * horizontalVideoScale);
            const scaledTextureHeightWithoutTimecode = Math.round(
                unscaledVideoHeight * verticalVideoScale,
            );

            const scaledTimecodeDigitWidth = Math.round(
                unscaledTimecodeDigitWidth * horizontalVideoScale,
            );
            const scaledTimecodeHeight = Math.round(unscaledTimecodeHeight * verticalVideoScale);
            const scaledTimecodePaddingTop = Math.round(unscaledTimecodePaddingTop * verticalVideoScale);

            const scaledTextureHeight =
                scaledTextureHeightWithoutTimecode + scaledTimecodeHeight + scaledTimecodePaddingTop;

            this.baseTexture.setSize(scaledTextureWidth, scaledTextureHeight);

            masterAssetDimensions = {
                width: scaledTextureWidth,
                height: scaledTextureHeight,
            };

            this.scaledTimecodeSettings = {
                ...this.timecodeSettings,
                timecodeDigitWidth: scaledTimecodeDigitWidth,
                timecodeDigitHeight: scaledTimecodeHeight,
                timecodePaddingTop: scaledTimecodePaddingTop,
            };
        } else {
            // If the videoElement has been changed, we need to make sure the size is set correctly
            this.baseTexture.setSize(this.options.assetWidth, this.options.assetHeight);

            masterAssetDimensions = {
                width: this.options.assetWidth,
                height: this.options.assetHeight,
            };

            this.scaledTimecodeSettings = this.timecodeSettings ? { ...this.timecodeSettings
            } : null;
        }

        const textureFitModifications = {
            ...defaultVideoMediaModifications,
            hasTimecode: this.hasTimecode,
            ...this.modifications,
            // Override the timecode settings with the scaled values for the texture
            // fit calculations.
            // TODO: Find a better way to do this
            timecodeSettings: this.scaledTimecodeSettings,
        };

        const {
            frame,
            orig,
            trim,
            scale
        } = prepareTextureFit(
            this.baseTexture,
            masterAssetDimensions, {
                width: this.options.displayWidth,
                height: this.options.displayHeight
            },
            textureFitModifications,
        );

        if (this.hasTimecode) {
            // Now that we've scaled, make sure we update the timecode's settings as well
            // Ceil these number so we don't get a Texture Error from being outside the bounds
            this.scaledTimecodeSettings.timecodeDigitWidth = Math.ceil(
                this.scaledTimecodeSettings.timecodeDigitWidth * scale,
            );
            this.scaledTimecodeSettings.timecodeDigitHeight = Math.ceil(
                this.scaledTimecodeSettings.timecodeDigitHeight * scale,
            );
            if ('timecodePaddingTop' in this.scaledTimecodeSettings) {
                this.scaledTimecodeSettings.timecodePaddingTop = Math.ceil(
                    this.scaledTimecodeSettings.timecodePaddingTop * scale,
                );
            }
        }

        this.texture = new Texture(this.baseTexture, frame, orig, trim);

        if (this.hasTimecode && this.shouldUseTimecode) {
            const {
                timecodeDigitHeight
            } = this.scaledTimecodeSettings;
            const {
                height: heightWithTimecode,
                width: widthWithTimecode
            } = this.baseTexture;
            const height = heightWithTimecode - timecodeDigitHeight;
            const timecodeFrame = new Rectangle(0, height, widthWithTimecode, timecodeDigitHeight);
            const timecodeOrig = new Rectangle(0, 0, this.baseTexture.width, this.baseTexture.height);
            this.timecodeTexture = new Texture(this.baseTexture, timecodeFrame, timecodeOrig);
            this.timecodeSprite = new Sprite(this.timecodeTexture);
        }
    }

    /**
     * Destroy this video and cleanup any remnants of it.
     */
    destroy() {
        this.audioMediaHandler.destroy();
        if (this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
        }
        this.teardownVideoSeeking();
        this.teardownVideoTimeUpdates();
        this.teardownVideoEndUpdates();
    }

    /**
     * Is this video fully buffered?
     *
     * @returns {boolean} True if the video has been fully buffered.
     */
    isFullyBuffered() {
        return (
            this.videoElement.buffered.start(0) === 0 &&
            this.videoElement.buffered.end(this.videoElement.buffered.length - 1) ===
            this.videoElement.duration
        );
    }

    setupVideoPlayingListener(eventListener) {
        this.activeVideoPlayingListener = eventListener;
        this.videoElement.addEventListener('playing', eventListener);
    }

    removeVideoPlayingListener() {
        this.videoElement.removeEventListener('playing', this.activeVideoPlayingListener);
        this.activeVideoPlayingListener = null;
    }

    /**
     * The method for actually firing off the playback of the audio media (if needed)
     * Audio playback errors will not result in a rejected promise so errors do not stop video playback
     */
    async playAudioMedia() {
        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO) {
            try {
                await this.audioMediaHandler.play();
            } catch (error) {
                // Don't re-raise the error because we don't want audio error stopping video playback
                console.error(error);
            }
        }
    }

    /**
     * The method for actually firing off the playback of the media (both video and audio)
     * Error handling should be done by implementer of this method
     * Audio playback errors will not result in a rejected promise so errors do not stop video playback
     */
    async playVideoMedia() {
        // Due to strict handling of media playback on iOS, we must fire off both the audio and video plays together
        // otherwise the user interaction event can be lost and result in the audio not playing.
        if (browserName === 'ios') {
            await Promise.all([this.videoElement.play(), this.playAudioMedia()]);
            // Otherwise, we want the audio media to fire after the video media, because audio will start to play back far
            // faster than the video media, and they will be (close) to synced up to start.
        } else {
            await this.videoElement.play();
            await this.playAudioMedia();
        }
    }

    /**
     * Play the video element, and return a promise that will resolve when the video begins playing
     *
     * @function play
     * @returns {Promise} Promise to resolve when the video begins playing
     */
    play() {
        this.mostRecentSeekToFrameResult = null;
        this.isVideoStoppedExternally = false;
        const player = async (resolve, reject) => {
            if (!this.isLoaded) {
                reject(new PlayError(playResult.abortedVideoNotLoaded));
                return;
            }

            if (this.activeVideoPlayingListener) {
                reject(new PlayError(playResult.abortedByActivePlayingRequest));
                return;
            }

            if (this.lastSeekToTimeListenerInfo) {
                reject(new PlayError(playResult.abortedBySeekToTimeRequest));
                return;
            }

            const onPlaying = async (timeoutId) => {
                this.onPlayStartTime = performance.now();
                this.removeVideoPlayingListener();
                clearTimeout(timeoutId);
                resolve(playResult.success);
            };

            const onPlayTimeout = () => {
                console.error('Timed out playing video');
                this.removeVideoPlayingListener();
                reject(new PlayError(playResult.timeout));
            };

            const timeoutId = setTimeout(onPlayTimeout, this.options.playTimeout);
            this.setupVideoPlayingListener(onPlaying.bind(this, timeoutId));
            try {
                await this.playVideoMedia();
            } catch (error) {
                this.removeVideoPlayingListener();
                console.error('VideoMediaHandler Playback Error:', error);
                reject(error);
                clearTimeout(timeoutId);
            }
        };

        return new Promise(player.bind(this));
    }

    /**
     * Stops the video element
     *
     * @function stop
     */
    stop() {
        this.isVideoStoppedExternally = true;
        this.videoElement.pause();
        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO) {
            this.audioMediaHandler.stop();
        }
    }

    /**
     * Seek the videoElement to the given target time.
     *
     * Note: This is heavily modified from the original ConfiguratorVideo.coffee from ivory.
     *  - The 'seeked' event handler has been replaced with a 'timeupdate' handler, which
     *    fires after a currentTime change has propogated to the renderable video buffer
     *  - The video is now paused before a time set attempt and the process will not begin
     *    until frame updates from the pause have ended. This is because a paused video
     *    may still update by a frame or two immediately after the video.pause() call
     *    (tested in Chrome 71 and Firefox 64 on MacOS 10.12.6).
     *
     * @param {number} targetTime The target time to seek to
     * @param {object} options options for seeking to time
     * @param {number} options.seekToTimeCode The current seek to time instance
     * @returns {Promise}          A Promise that will resolve when the seek has completed. The Promise
     *                            will be rejected (a) if the seek doesn't complete within options.seekToTimeTimeout number of milliseconds.
     *                            in which case it will have an argument of VideoMediaHandler.SEEK_TO_TIME_RESULT.TIMEOUT or
     *                            (b) if a subsequent seekToTime call occurred before this seekToTime call resolved, in which case
     *                            it will have an argument of VideoMediaHandler.SEEK_TO_TIME_RESULT.ABORTED_BY_SUBSEQUENT_SEEK.
     */
    async seekToTime(targetTime, {
        seekToTimeCode = performance.now()
    } = {}) {
        // Safari Bug: target time can't be less than 0
        const safeTargetTime = Math.max(0, targetTime);

        this.mostRecentSeekToFrameResult = null;
        this.latestSeekToTimeCode = seekToTimeCode;
        if (this.lastSeekToTimeListenerInfo) {
            if (this.lastSeekToTimeListenerInfo.listenerId) {
                this.removeVideoTimeUpdateListener(this.lastSeekToTimeListenerInfo.listenerId);
            }
            this.removeVideoEndUpdateListener(this.lastSeekToTimeListenerInfo.endUpdateListenerId);
            clearTimeout(this.lastSeekToTimeListenerInfo.timeoutId);
            const {
                reject
            } = this.lastSeekToTimeListenerInfo;
            this.lastSeekToTimeListenerInfo = null;
            reject(new SeekToTimeError(seekToTimeResult.abortedBySubsequentSeek));
            return;
        }

        const onTimeUpdateExecutor = (resolve, reject) => {
            let listenerId;
            if (!this.isLoaded) {
                reject(new SeekToTimeError(seekToTimeResult.abortedVideoNotLoaded));
                return;
            }

            // If we are already at the current time, we can resolve successfully
            if (this.videoElement.currentTime === safeTargetTime) {
                const timeRanges = this.videoElement.buffered;
                /* eslint-disable-next-line */
                if (timeRanges != null ? timeRanges.length : void 0) {
                    for (let timeRangeIndex = 0; timeRangeIndex < timeRanges.length; timeRangeIndex += 1) {
                        if (
                            safeTargetTime >= timeRanges.start(timeRangeIndex) &&
                            safeTargetTime <= timeRanges.end(timeRangeIndex)
                        ) {
                            resolve(seekToTimeResult.success);
                            return;
                        }
                    }
                }
            }

            // If we don't seek in enough time, reject promise
            const onTimeUpdateTimeout = (listenerInfoArg) => {
                this.removeVideoTimeUpdateListener(listenerInfoArg.listenerId);
                this.removeVideoEndUpdateListener(listenerInfoArg.endUpdateListenerId);
                if (this.lastSeekToTimeListenerInfo.listenerId === listenerInfoArg.listenerId) {
                    this.lastSeekToTimeListenerInfo = null;
                }
                listenerInfoArg.reject(new SeekToTimeError(seekToTimeResult.timeout));
            };

            const onUpdateTime = async (listenerInfoArg) => {
                this.removeVideoTimeUpdateListener(listenerInfoArg.listenerId);
                clearTimeout(listenerInfoArg.timeoutId);
                if (this.isVideoStoppedByVideoMediaHandler) {
                    this.isVideoStoppedByVideoMediaHandler = false;

                    // If the video has been stopped externally to the handler (ex: by a stop() call during the seek)
                    // don't restart it.
                    if (!this.isVideoStoppedExternally) {
                        try {
                            await this.playVideoMedia();
                        } catch (e) {
                            reject(new SeekToTimeError(seekToTimeResult.playError));
                        }
                    }
                }
                if (this.lastSeekToTimeListenerInfo.listenerId === listenerInfoArg.listenerId) {
                    this.lastSeekToTimeListenerInfo = null;
                }
                listenerInfoArg.resolve(seekToTimeResult.success);
            };

            const onEndUpdateListener = (listenerInfoArg) => {
                this.removeVideoEndUpdateListener(listenerInfoArg.endUpdateListenerId);

                const timeoutId = setTimeout(
                    onTimeUpdateTimeout.bind(this, listenerInfoArg),
                    this.options.seekToTimeTimeout,
                );
                // eslint-disable-next-line no-param-reassign
                listenerInfoArg.timeoutId = timeoutId;
                listenerId = this.addVideoTimeUpdateListener(
                    safeTargetTime,
                    onUpdateTime.bind(this, listenerInfoArg),
                );
                // eslint-disable-next-line no-param-reassign
                listenerInfoArg.listenerId = listenerId;
                this.videoElement.currentTime = safeTargetTime;
            };

            const listenerInfo = {
                resolve,
                reject,
                safeTargetTime,
            };

            this.lastSeekToTimeListenerInfo = listenerInfo;
            const endUpdateListenerId = this.addVideoEndUpdateListener(
                safeTargetTime,
                onEndUpdateListener.bind(this, this.lastSeekToTimeListenerInfo),
            );
            listenerInfo.endUpdateListenerId = endUpdateListenerId;

            if (!this.videoElement.paused) {
                this.isVideoStoppedByVideoMediaHandler = true;
                this.stop();
            }
        };

        // eslint-disable-next-line consistent-return
        return new Promise(onTimeUpdateExecutor.bind(this));
    }

    getCurrentTime() {
        return this.videoElement ? this.videoElement.currentTime : null;
    }

    get isPlaying() {
        return this.videoElement ? !this.videoElement.paused : false;
    }

    get playbackRate() {
        // eslint-disable-next-line no-underscore-dangle
        return this._playbackRate;
    }

    set playbackRate(playbackRate) {
        // eslint-disable-next-line no-underscore-dangle
        this._playbackRate = playbackRate;
        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO) {
            this.audioMediaHandler.playbackRate =
                performance.now() - this.onPlayStartTime > INITIAL_PLAYBACK_SYNC_DURATION ?
                constrainPlaybackRate(playbackRate) :
                constrainInitialPlaybackRate(playbackRate, this.playbackRate);
        }
    }

    /**
     * Handles the actual setting of playbackrate on the media element
     *
     * @param {number} rate The speed of the media's playback ex: 1.0 is normal, 2.0 is twice as fast
     */
    setMediaPlaybackRate(rate) {
        // Safari doesn't handle playback rate changes very gracefully
        if (['safari', 'ios'].includes(browserName)) {
            return;
        }

        this.videoElement.playbackRate =
            performance.now() - this.onPlayStartTime > INITIAL_PLAYBACK_SYNC_DURATION ?
            constrainPlaybackRate(rate) :
            constrainInitialPlaybackRate(rate, this.playbackRate);
    }

    /**
     * Adds a listener callback to be called when a given targetTime is seeked
     * to by the videoElement.
     *
     * @param {number}   targetTime The seek time at which to call the listener callback.
     * @param {Function} callback   The listener callback.
     * @returns {number} listenerId   The id of the listener. To be used with removeVideoSeekLisener.
     */
    addVideoSeekListener(targetTime, callback) {
        const listenerId = _.uniqueId();

        this.videoSeekingListeners = this.videoSeekingListeners.concat([{
            targetTime,
            callback,
            id: listenerId,
        }, ]);
        return listenerId;
    }

    addVideoTimeUpdateListener(targetTime, callback) {
        const listenerId = _.uniqueId();

        this.videoTimeUpdateListeners = this.videoTimeUpdateListeners.concat([{
            targetTime,
            callback,
            id: listenerId,
        }, ]);

        return listenerId;
    }

    addVideoEndUpdateListener(targetTime, callback) {
        const listenerId = _.uniqueId();

        this.videoEndUpdateListeners = this.videoEndUpdateListeners.concat([{
            targetTime,
            callback,
            id: listenerId,
        }, ]);

        return listenerId;
    }

    /**
     * Removes the video seek listener with the given listenerId.
     *
     * @param  {number} listenerId The id of the listener given by addVideoSeekListener.
     * @returns {boolean}           True if the listener was successfully removed
     */
    removeVideoSeekListener(listenerId) {
        let isSuccessfullyRemoved = false;

        this.videoSeekingListeners = this.videoSeekingListeners.filter((listener) => {
            if (listener.id === listenerId) {
                isSuccessfullyRemoved = true;
                return false;
            }
            return true;
        });

        return isSuccessfullyRemoved;
    }

    removeVideoTimeUpdateListener(listenerId) {
        let isSuccessfullyRemoved = false;

        this.videoTimeUpdateListeners = this.videoTimeUpdateListeners.filter((listener) => {
            if (listener.id === listenerId) {
                isSuccessfullyRemoved = true;
                return false;
            }
            return true;
        });

        return isSuccessfullyRemoved;
    }

    removeVideoEndUpdateListener(listenerId) {
        let isSuccessfullyRemoved = false;

        this.videoEndUpdateListeners = this.videoEndUpdateListeners.filter((listener) => {
            if (listener.id === listenerId) {
                isSuccessfullyRemoved = true;
                return false;
            }
            return true;
        });

        return isSuccessfullyRemoved;
    }

    /**
     * The duration (in seconds) of the loaded video element.
     *
     * @returns {number | undefined} The duration of the loaded video element or null if the duration isn't available yet.
     */
    get duration() {
        return this._duration;
    }

    /**
     * Get the maximum frame number.
     * Note: Timecodes are zero-indexed, so this getter returns 1 + the maximum navigatable
     * frame number (similar to Array.length).
     *
     * @returns {number} the max frame video of the video
     */
    get maximumFrameNumber() {
        const maximumFrameNumber = Math.max(
            Math.floor((this.duration || 0) * this.options.framerate) - 1,
            0,
        );

        return maximumFrameNumber;
    }

    /**
     * Seeks the video to the provided frame. This is intended for accurate seeking that uses an embedded timecode
     * to determine the exact frame. Attempting to seek to a frame without a timecode will throw an error
     *
     * @param      {number}   frameNumber  The frame number
     * @returns {Promise} Promise that resolves when the video has finished seeking
     */
    async seekToFrame(frameNumber) {
        // Return early if the currentTime hasn't changed and the requested frame
        // hasn't changed.
        // We need to compare both the currentTime and the requested frame number
        // because either can change. We bust the result cache on play() or
        // seekToTime() call, but videoElement.currentTime and videoElement.play()
        // can still be called directly.
        if (
            this.mostRecentSeekToFrameResult &&
            this.mostRecentSeekToFrameResult.frameNumber === frameNumber &&
            this.mostRecentSeekToFrameResult.currentTime.toFixed(5) ===
            this.videoElement.currentTime.toFixed(5)
        ) {
            return;
        }
        if (!this.shouldUseTimecode) {
            // Use imprecise seeking if a timecode is unavailable.
            const seconds = frameNumberToSeconds(frameNumber, this.options.framerate);
            await this.seekToTime(seconds);
        } else {
            await seekVideoToFrame(
                this,
                this.options.renderer,
                this.timecodeSprite,
                frameNumber,
                this.options.framerate,
                this.scaledTimecodeSettings,
            );
        }

        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO) {
            this.audioMediaHandler.playbackRate = this.playbackRate;
            await this.audioMediaHandler.seekToFrame(frameNumber);
        }

        this.mostRecentSeekToFrameResult = {
            currentTime: this.videoElement.currentTime,
            frameNumber,
        };
    }

    /**
     * Sync the video to a provided frame. This is intended for fast real-time syncs that occur while
     * the video is playing.
     *
     * This method will always resolve in <33ms unless it determines that a >33ms runtime is
     * beneficial in the long run--for example, when the video is very far from the requested frame
     * number and a sub-33ms sync won't get the video back on track.
     *
     * WARNING: This method is intended to be called once per video frame, and calling it with less
     * frequency negatively impacts its performance.
     *
     * WARNING: This method is imprecise and will resolve before the video is synced because sync
     * operations take more than one frame to complete.
     *
     * @param {number} frameNumber The frame number to update the video to
     * @returns {Promise} Promise that resolves when the video has been updated to the correct frame number
     */
    async syncToFrame(frameNumber) {
        const currentFrameNumber = secondsToFrameNumber(
            this.videoElement.currentTime,
            this.options.framerate,
            this.isPlaying,
        );
        const frameOffset = frameNumber - currentFrameNumber;
        this.totalFramesElapsed += 1;

        // Seek the video manually instead of adjusting the playbackRate if the video is > 1 second ahead
        // of the target, 1/4 of a second behind the target, or the timeline is paused.
        // TODO: Potential optimization: seekToTime takes a lot longer than one frame, so should we
        // overestimate the seekToTime target? Otherwise, playbackRate adjustments will usually be
        // required when seekToTime is called during playback.
        if (
            // Video is > 1 second ahead of target
            frameOffset > this.options.framerate ||
            // Video is > 1/4 of a second behind target
            frameOffset * -4 > this.options.framerate ||
            // Timeline is paused
            (frameOffset && !this.isPlaying)
        ) {
            try {
                this.playbackSyncStep = PLAYBACK_SYNC_STEP.seeking;
                this.setMediaPlaybackRate(this.playbackRate);
                const seconds = frameNumberToSeconds(frameNumber, this.options.framerate);
                // Create and observe a seek-to-time code.
                // If seekToTime is interrupted, this code will be used to determine whether the seekToTime
                // request was interrupted by a call to syncToFrame or seekToTime.
                this.latestSyncToFrameSeekToTimeCode = performance.now();
                await this.seekToTime(seconds, {
                    seekToTimeCode: this.latestSyncToFrameSeekToTimeCode
                });
            } catch (error) {
                if (
                    error instanceof SeekToTimeError &&
                    error.code === seekToTimeResult.abortedBySubsequentSeek
                ) {
                    let step;
                    if (this.latestSyncToFrameSeekToTimeCode === this.latestSeekToTimeCode) {
                        // The latest seekToTime operation was initiated by a call to syncToFrame
                        console.warn('abortedBySubsequentSeek. Interrupted by call to syncToFrame');
                        step = PLAYBACK_SYNC_STEP.abortedBySubsequentSyncToFrame;
                    } else {
                        // The latest seekToTime operation was initiated by a call directly to seekToTime
                        console.warn('abortedBySubsequentSeek. Interrupted by call directly to seekToTime');
                        step = PLAYBACK_SYNC_STEP.abortedBySubsequentSeekToTime;
                        this.playbackSyncStep = PLAYBACK_SYNC_STEP.polling;
                    }

                    const resolvedFrameNumber = secondsToFrameNumber(
                        this.videoElement.currentTime,
                        this.options.framerate,
                        this.isPlaying,
                    );

                    return {
                        actualFrameNumber: currentFrameNumber,
                        resolvedFrameNumber,
                        step,
                    };
                }

                this.playbackSyncStep = PLAYBACK_SYNC_STEP.polling;
                throw error;
            }

            this.playbackSyncStep = PLAYBACK_SYNC_STEP.polling;
        }

        switch (this.playbackSyncStep) {
            case PLAYBACK_SYNC_STEP.polling:
                {
                    if (frameOffset === 0) {
                        break;
                    }

                    // Nonzero frame offset is detected.
                    // Advance to 'measuring' step without breaking the switch case.
                    this.playbackSyncStep = PLAYBACK_SYNC_STEP.measuring;
                }
                // eslint-disable-next-line no-fallthrough
            case PLAYBACK_SYNC_STEP.measuring:
                {
                    this.frameOffsets.push(frameOffset);
                    if (this.frameOffsets.length === FRAME_OFFSET_MEASUREMENT_COUNT) {
                        // Required number of frame offset datapoints are collected.
                        // Calculate the average frame offset.
                        let totalFrameOffset = 0.0;
                        while (this.frameOffsets.length) {
                            totalFrameOffset += this.frameOffsets.pop();
                        }

                        const averageFrameOffset = Math.round(totalFrameOffset / FRAME_OFFSET_MEASUREMENT_COUNT);

                        if (averageFrameOffset) {
                            // Nonzero average frame offset.
                            // Adjust playbackRate and advance to 'adjusting' step.
                            this.startAdjustmentTime = performance.now();

                            // Calculate how much the playbackRate needs to change (relative to defaultPlaybackRate)
                            // to achieve zero frame offset within MAX_PLAYBACK_RATE_ADJUSTMENT_PROPORTION.
                            const playbackSyncOffsetMultiplier =
                                this.playbackRate * MAX_PLAYBACK_RATE_ADJUSTMENT_PROPORTION;

                            this.setMediaPlaybackRate(
                                this.playbackRate + playbackSyncOffsetMultiplier * averageFrameOffset,
                            );
                            this.totalTimesAdjusted += 1;

                            this.playbackSyncStep = PLAYBACK_SYNC_STEP.adjusting;
                        } else {
                            // Zero average frame offset. Revert to 'polling' step.
                            this.playbackSyncStep = PLAYBACK_SYNC_STEP.polling;
                        }
                    }
                    break;
                }
            case PLAYBACK_SYNC_STEP.adjusting:
                {
                    this.totalFramesAdjusted += 1;
                    const frameOffsetAdjustmentLength =
                        1000 / this.options.framerate / MAX_PLAYBACK_RATE_ADJUSTMENT_PROPORTION;
                    const currentAdjustmentLength = performance.now() - this.startAdjustmentTime;

                    // TODO: Do we want to end the adjustment period for frameOffset === 0?
                    // Zero frame offsets can occur during adjustment periods even if the video is off track.
                    if (frameOffset === 0 || currentAdjustmentLength >= frameOffsetAdjustmentLength) {
                        // Zero frame offset or end of adjustment time period is reached.
                        // Reset playbackRate and revert to 'polling' step.
                        this.setMediaPlaybackRate(this.playbackRate);
                        this.playbackSyncStep = PLAYBACK_SYNC_STEP.polling;
                    }
                    break;
                }
            case PLAYBACK_SYNC_STEP.seeking:
                {
                    // Nothing to do here
                    break;
                }
            default:
                {
                    throw new Error(`Unknown playback sync step: ${this.playbackSyncStep}`);
                }
        }

        const resolvedFrameNumber = secondsToFrameNumber(
            this.videoElement.currentTime,
            this.options.framerate,
            this.isPlaying,
        );

        if (!SHOULD_USE_VIDEO_ELEMENT_FOR_AUDIO) {
            await this.audioMediaHandler.seekToFrame(resolvedFrameNumber);
        }

        return {
            actualFrameNumber: currentFrameNumber,
            resolvedFrameNumber,
            step: this.playbackSyncStep,
        };
    }

    onVideoTimeUpdated() {
        this.lastUpdateTimeForInterval = performance.now();

        if (!this.videoTimeUpdateListeners.length) {
            return;
        }

        this.videoTimeUpdateListeners.forEach((listener) => {
            listener.callback();
        });
    }

    onVideoEndUpdated() {
        if (!this.videoEndUpdateListeners.length) {
            return;
        }

        this.videoEndUpdateListeners.forEach((listener) => {
            listener.callback();
        });
    }

    onVideoSeeked(event) {
        if (!this.videoSeekingListeners.length) {
            return;
        }

        const seekedTime = event.target.currentTime;

        this.videoSeekingListeners.forEach((listener) => {
            if (roundSeekTime(seekedTime) === roundSeekTime(listener.targetTime)) {
                listener.callback();
            }
        });
    }
}
/* eslint-enable no-underscore-dangle */