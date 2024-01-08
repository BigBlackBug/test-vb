/* global CURRENT_PACKAGE_VERSION */
/* eslint-disable no-underscore-dangle, jsdoc/no-undefined-types */
// Vendor
import _ from 'lodash';
import {
    Application,
    Loader,
    Rectangle,
    RENDERER_TYPE,
    utils,
    settings as pixiSettings,
    Graphics,
    CompositionContainer,
} from 'pixi.js';

// Local
import {
    ChangeOperations
} from './changeOperations/index.js';
import {
    createCompositionFromLayer,
    waymarkAuthorCustomProperties,
    PlayError,
    playResult,
    loadAllAssets,
} from './layers/index.js';
import {
    findLayerData,
    filterLayerData,
    migrateFontsToAssets
} from './manifest/index.js';
import {
    Timeline
} from './timeline/index.js';
import settings from './settings.js';
import {
    createHeldPromise,
    gainToVolume,
    getAudioContext,
    volumeToGain
} from './utils/index.js';
import {
    unlockAudioPool,
    unlockAudioContext
} from './unlockAudio.js';

// We will allow for major perforamnce caveats to succeed, but these caveats are detectable
// through WaymarkAuthorWebRenderer.
pixiSettings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false;

let id = 0;

let support;

/**
 * The custom Waymark Renderer that utilizes pixijs and greensock
 *
 * ```
 * This class emits some events that can be trapped for performance logging:
 *   setup:start ........ Setup operation begins
 *   setup:end .......... Setup operation ends
 *   frameRender:start .. Frame begins rendering
 *   frameRender:end .... Frame ends rendering
 *   updateRealFPS ...... Real FPS is calculated for most recent frame render
 *   goToFrame:start .... goToFrame operation begins
 *   goToFrame:end ...... goToFrame operation ends
 *   playback:complete .. Main timeline ends
 *   playback:play ...... The renderer has started playing
 *   playback:stop ...... The renderer has been stopped
 * ```
 *  TODO: Cleanup promise creation for play/stop/setup/etc.
 *
 * @class      WaymarkAuthorWebRenderer (name)
 * @param      {object}  options              The options for a renderer instance
 * @param      {object}  options.additionalPixiOptions  The options for a pixi application
 * @public
 */
class WaymarkAuthorWebRenderer extends utils.EventEmitter {
    constructor(options = {}) {
        super(options);
        const {
            additionalPixiOptions
        } = options;

        // @type {Number} The number of times the context has been restored. This could be useful for trying to detect whether or not something has gone wrong
        this.contextRestoreCount = 0;
        this.additionalPixiOptions = additionalPixiOptions;
        this.executingTickCount = 0;
        this.startTime = null;
        this.scale = 1;
        this.realFPS = null;
        this.lastFrameUpdateTime = null;
        this.shouldTick = false;
        this.videoData = null;
        this.previousTickTime = null;
        this.currentTime = 0;
        this.frameDifference = 0;

        this._isSetup = false;
        this._isPlaying = false;
        this._isLoading = false;
        this._framerate = 30;

        // An unmodified copy of the video data for reference when restoring data.
        this.originalVideoData = null;

        this._audioContext = getAudioContext();
        // Make a gain that controls the muting and overall volume
        this._masterAudioNode = this._audioContext.createGain();
        this._masterAudioNode.connect(this._audioContext.destination);
        this.isMuted = false;
        this._volume = gainToVolume(this._masterAudioNode.gain.value); // 1.0

        this._audioMediaHandlers = [];

        // Give the renderer an ID for debugability.
        this.id = id;
        id += 1;

        // Add the renderer to the global registry
        WaymarkAuthorWebRenderer.debugger ? .addActiveRenderer(this);
    }

    /**
     * The different types of support returned by `WaymarkAuthorWebRenderer.analyzeSupport()`.
     * Note: Some room was left between the values of `REDUCED_PERFORMANCE` and `FULLY_SUPPORTED` just in
     * case we get more sophisticated about how we determine these things.
     */
    static SUPPORT = {
        UNSUPPORTED: -1,
        REDUCED_PERFORMANCE: 0,
        FULLY_SUPPORTED: 10,
    };

    /**
     * Analyze the current execution environment for the level of support. Performance caveats likely suggest that hardware accelerated WebGL is either
     * unsupported or turned off in the execution environment.
     *
     * @returns {number}
     * `WaymarkAuthorWebRenderer.SUPPORT.UNSUPPORTED` - This execution environment is not supported
     * `WaymarkAuthorWebRenderer.SUPPORT.REDUCED_PERFORMANCE` - This execution environment is supported, but will likely experience reduced performance.
     *  Performance caveats likely suggest that hardware accelerated WebGL is either unsupported or turned off in the execution environment.
     * `WaymarkAuthorWebRenderer.SUPPORT.FULLY_SUPPORTED` - This execution environment is fully supported.
     * @public
     */
    static analyzeSupport() {
        // Use the cached analysis if `analyzeSupport` has already been run
        if (support) {
            return support;
        }

        // First, we'll see if PIXI thinks WebGL is supported. If it's not, we'll say so.
        const isWebGLSupported = utils.isWebGLSupported();
        if (!isWebGLSupported) {
            support = WaymarkAuthorWebRenderer.SUPPORT.UNSUPPORTED;
            return support;
        }

        // Now, we'll use basically what's under the hood for PIXI.utils.isWebGLSupported. If this test fails,
        // we know that webGL *is* supported but with performance caveats.
        const contextOptions = {
            stencil: true,
            failIfMajorPerformanceCaveat: true
        };
        const canvas = document.createElement('canvas');
        let webgl =
            canvas.getContext('webgl', contextOptions) ||
            canvas.getContext('experimental-webgl', contextOptions);
        const isFullySupported = Boolean(webgl && webgl.getContextAttributes().stencil);

        // Cleanup the WebGL context if it was created
        // https://stackoverflow.com/questions/23598471/how-do-i-clean-up-and-unload-a-webgl-canvas-context-from-gpu-after-use#comment76013781_38027471
        if (webgl) {
            const loseContext = webgl.getExtension('WEBGL_lose_context');
            if (loseContext) {
                loseContext.loseContext();
            }
            webgl = null;
        }

        support = isFullySupported ?
            WaymarkAuthorWebRenderer.SUPPORT.FULLY_SUPPORTED :
            WaymarkAuthorWebRenderer.SUPPORT.REDUCED_PERFORMANCE;

        return support;
    }

    /**
     * Setup the renderer with the passed video data
     *
     * @alias setup
     * @param  {object}    setupOptions              Setup options
     * @param  {object[]}  setupOptions.changesList  Optional array of renderer changes
     * @param  {object}    setupOptions.videoData    Project manifest video data
     * @param  {HTMLCanvasElement}    setupOptions.view         Optional target view
     * @returns {Promise}  A promise that resolves when the renderer has been setup
     */
    async _setup(setupOptions) {
        const {
            changesList,
            videoData,
            view
        } = setupOptions;
        if (_.isEmpty(videoData)) {
            throw Error(
                'Must provide an object that includes `videoData` when calling WaymarkAuthorWebRenderer.setup()',
            );
        }
        this._isLoading = true;
        this.shouldTick = true;

        // this.isValidData(videoData)

        this.videoData = videoData;
        this.originalVideoData = _.cloneDeep(videoData);
        this._framerate = this.videoData.fr;

        this.emit('setup:start');

        if (changesList) {
            await this.applyChangeList(changesList, {
                shouldUpdateStage: false
            });
        }

        const pixiOptions = {
            autoStart: false,
            width: this.videoData.w,
            height: this.videoData.h,
            antialias: true,
            resolution: 1,
            backgroundAlpha: 1,
            backgroundColor: 0x000000,
            sharedLoader: true,
            powerPreference: 'high-performance',
            ...this.additionalPixiOptions,
        };

        // The consumer can optionally provide a canvas element to serve as the application view.
        if (view) {
            pixiOptions.view = view;
        }

        // We use a higher filter resolution to avoid problems with antialiasing.
        // This does have performance implications, so we have to be aware of templates with
        // a ton of filters. FILTER_RESOLUTION must be a power of 2, per https://github.com/pixijs/pixijs/issues/6453
        // When setting to a non power-of-2 we've seen Sprite resizing problems (specifically the "Media Modifications and Sprite Bounds" test).
        //
        // This is written currently to (a) ensure that it gets set before `new Application()` and (b)
        // to ensure a FILTER_RESOLUTION minimum while still allowing an override.
        if (settings.EFFECT_QUALITY === 'high' && pixiSettings.FILTER_RESOLUTION < 4) {
            pixiSettings.FILTER_RESOLUTION = 4;
        } else if (pixiSettings.FILTER_RESOLUTION < 2) {
            pixiSettings.FILTER_RESOLUTION = 2;
        }

        // TODO: Remove Pixi Application and create our own custom objects
        this.pixiApplication = new Application(pixiOptions);

        window.__PIXI_APP__ = this.pixiApplication;
        // We don't need the default pixi application render on tick call.
        // We will be managing our render orders via our Timeline Hooks
        this.pixiApplication.ticker.remove(this.pixiApplication.render, this.pixiApplication);

        if (this.pixiApplication.renderer.type !== RENDERER_TYPE.WEBGL) {
            console.warn(
                'This browser does not support WebGL. Rendering performance may be drastically reduced or broken.',
            );
        }

        this.pixiApplication.stage.name = this.videoData.nm;
        // Set the composition bounds
        // TODO: get rid of the application/stage creation and just make a CompositionContainer
        this.pixiApplication.stage._compositionBounds = new Rectangle(
            0,
            0,
            this.videoData.w,
            this.videoData.h,
        );

        // Set/determine types, etc.
        migrateFontsToAssets(this.videoData);

        try {
            await loadAllAssets(this.videoData.assets);
        } catch (e) {
            console.error('Error loading assets', e);
        }

        const {
            timeline
        } = await createCompositionFromLayer(
            this.pixiApplication,
            this.pixiApplication.stage,
            this.videoData.assets,
            this.videoData.layers,
            this._framerate,
            new Rectangle(0, 0, this.videoData.w, this.videoData.h),
            this,
        );

        this.pixiApplication.stage.layerTimeline = timeline;

        try {
            // Perform post stage creation calls on all objects
            await this.pixiApplication.stage.callAllChildrenAsync(async (child) => {
                if (_.isFunction(child[waymarkAuthorCustomProperties.postStageCreationSetup])) {
                    await child[waymarkAuthorCustomProperties.postStageCreationSetup]();
                }
            });
        } catch (error) {
            console.error('Something went wrong during postStageCreationSetup');
        }

        // TODO: Make sure to add a stop!
        // This is a bit of a hacky fix to stop the timeline from playing after the root composition's out time
        // timeline.add(() => {
        //   timeline.pause();
        //   timeline.combinedEventCallback('onComplete');
        // }, this.videoData.op - 1);

        // Subtract 1 from the outpoint so that the waymarkDuration
        // corresponds with the last visible frame of the timeline.
        timeline.duration = this.videoData.op - 1;

        timeline.registerHookCallback(Timeline.hookNames.complete, () => {
            // Prevent the onComplete actions from firing if the reported time is less than the timeline
            // duration.
            // This can happen if the video is paused at the final frame and goToFrame(0) is called.
            // TODO: Does this fix apply to the new timeline?
            if (Math.round(timeline.currentTime) < timeline.duration) {
                return;
            }

            // Stop the whole timeline on complete so things like audioHandlers can shut down sourceNodes
            this.stop();

            this.emit('playback:complete');
        });

        this.rootTimeline = timeline;

        this.rootTimeline.registerHookCallback('beforeRender', this.onRenderStart);
        /*
         * Because we require an updated worldTransform for a DisplayObject to calculate
         * the filter area of the object with motion blur, we were running into an issue when calling
         * goToFrame to advance the timeline after the object is seen for the first time. We get into an
         * off-by-one calculation error, where we attempt to calculate the filterArea with outdated worldTransforms
         * We now call a pixiApplication.render() in renderApp before attempting to calculate the filterArea, thus giving
         * us the correct calculations.
         */
        this.rootTimeline.registerHookCallback(
            Timeline.hookNames.propertiesRendered,
            this.pixiApplication.render.bind(this.pixiApplication),
        );
        this.rootTimeline.registerHookCallback(Timeline.hookNames.endRender, this.onRenderEnd);
        this.rootTimeline.on('afterSyncToFrameCalled', this.onAfterSyncToFrameCalled);
        this.rootTimeline.allChildren.forEach((childTimeline) => {
            childTimeline.on('afterSyncToFrameCalled', this.onAfterSyncToFrameCalled);
        });

        await this.rootTimeline.goToTime(0);

        // Make sure the ticker is off and not running when we start
        this.pixiApplication.ticker.stop();
        this.pixiApplication.ticker.maxFPS = this.videoData.fr;
        this.pixiApplication.ticker.add(this.onTick, this);

        // One last render befor stopping
        this.pixiApplication.render();

        requestAnimationFrame(this.onRequestAnimationFrame);

        this._isSetup = true;
        this._isLoading = false;

        // If debug mode is active, also set it up
        if (settings.IS_DEBUGGING_ENABLED) {
            WaymarkAuthorWebRenderer.debugger ? .setupRendererDebugging(this);
        }

        this._onContextRestored = this.onContextRestored.bind(this);
        this._onContextLost = this.onContextLost.bind(this);

        this.pixiApplication.view.addEventListener('webglcontextrestored', this._onContextRestored);
        this.pixiApplication.view.addEventListener('webglcontextlost', this._onContextLost);

        this.emit('setup:end');
    }

    onContextRestored() {
        this.contextRestoreCount += 1;
        console.warn('WebGL context being restored for the rendering stage.');
        // Since the context has been restored, we'll need to re-render all of our Pixi objects
        this.pixiApplication.render();
    }

    onContextLost() {
        console.warn('WebGL context lost for the rendering stage.');
        // Since the context has been restored, we'll need to re-render all of our Pixi objects
        this.pixiApplication.render();
    }

    /**
     * Event handler for the start of a render tick
     *
     * @private
     */
    onRenderStart = () => {
        if (this.rootTimeline && this.isPlaying) {
            this.emit('frameRender:start', {
                frameNumber: this.rootTimeline.currentTime,
            });
        }
    };

    /**
     * Event handler for the end of a render tick
     *
     * @private
     */
    onRenderEnd = () => {
        if (this.rootTimeline) {
            this.pixiApplication.render();

            if (this.isPlaying) {
                this.emit('frameRender:end', {
                    frameNumber: this.rootTimeline.currentTime,
                });
            }
        }
    };

    /**
     * Event handler for after a sync-to-frame action
     *
     * @param {object} option Options object for the callback
     * @param {PIXI.Sprite} option.sprite The video layer that needs to be synced correctly
     * @param {number} option.requestedFrameNumber The timeline requested frame number
     * @param {number} option.actualFrameNumber The frame number read off of the video texture
     * @param {number} option.resolvedFrameNumber The frame number that the operation reports
     * @param {string} option.step The "step" in the video syncing process this event takes place at
     * @private
     */
    onAfterSyncToFrameCalled = ({
        sprite,
        requestedFrameNumber,
        actualFrameNumber,
        resolvedFrameNumber,
        step,
    }) => {
        this.emit('syncToFrame', {
            sprite,
            requestedFrameNumber,
            actualFrameNumber,
            resolvedFrameNumber,
            step,
        });
    };

    /**
     * @returns {boolean} Is the renderer currently playing
     * @public
     */
    get isPlaying() {
        return this._isPlaying;
    }

    /**
     * Set isPlaying. Do not use this! Use play() and stop() instead.
     *
     * @private
     */
    // eslint-disable-next-line class-methods-use-this
    set isPlaying(isPlaying) {
        throw new Error('Cannot set isPlaying');
    }

    /**
     * @returns {boolean} is renderer Loading (a state if a change is being applied or assets are loading)
     * @public
     */
    get isLoading() {
        return this._isLoading;
    }

    /**
     * Set isLoading. Do not use this! Use setup(), applyChange(), applyChangeList() instead.
     *
     * @private
     */
    // eslint-disable-next-line class-methods-use-this
    set isLoading(isLoading) {
        throw new Error('Cannot set isLoading');
    }

    /**
     * @returns {boolean} has the renderer setup
     * @public
     */
    get isSetup() {
        return this._isSetup;
    }

    /**
     * Set isSetup. Do not use this! Use setup(), applyChange(), applyChangeList() instead.
     *
     * @private
     */
    // eslint-disable-next-line class-methods-use-this
    set isSetup(isSetup) {
        throw new Error('Cannot set isSetup');
    }

    /**
     * Gets the renderer volume (0 is mute, 1.0 is normal 2.0 is twice normal)
     *
     * @type       {number}
     * @public
     */
    get volume() {
        return this._volume;
    }

    /**
     * Sets the renderer volume (0 is mute, 1.0 is normal 2.0 is twice normal)
     *
     * @type       {number}
     * @public
     */
    set volume(value) {
        this._volume = value;
        if (!this.isMuted) {
            this._masterAudioNode.gain.value = volumeToGain(this._volume);
        }
    }

    /**
     * @returns {number} The frames per second of the root timeline (ex: 30)
     * @public
     */
    get framerate() {
        return this._framerate;
    }

    /**
     * @private
     */
    // eslint-disable-next-line class-methods-use-this
    set framerate(value) {
        throw Error('framerate cannot be set');
    }

    /**
     * @returns {HTMLCanvasElement|null} The canvas element used to display the renderer
     * @public
     */
    get view() {
        if (!this._isSetup) {
            return null;
        }
        return this.pixiApplication.renderer.view;
    }

    /**
     * @private
     */
    // eslint-disable-next-line class-methods-use-this
    set view(value) {
        throw Error('view cannot be set');
    }

    /**
     * Destroys the renderer instance and removes it from the global registry
     *
     * @public
     */
    destroy() {
        if (this.isSetup) {
            this.tearDown();
        }
        // Remove the renderer from the registry
        WaymarkAuthorWebRenderer.debugger ? .removeActiveRenderer(this);
    }

    /**
     * The opposite of setup: removes the application, loaded resources, timelines, and layerers from the renderer
     *
     * @public
     */
    tearDown() {
        this.shouldTick = false;

        this.videoData = {};
        this.originalVideoData = {};

        if (this.pixiApplication) {
            this.pixiApplication.view.removeEventListener(
                'webglcontextrestored',
                this._onContextRestored,
            );
            this.pixiApplication.view.removeEventListener('webglcontextlost', this._onContextLost);
            this.pixiApplication.ticker.stop();
            this.pixiApplication.destroy(false, true);
        }

        this.pixiApplication = null;

        if (this.rootTimeline) {
            this.rootTimeline.destroy();
            this.rootTimeline = null;
        }

        this.emit('tearDown');
    }

    /**
     * Plays the animation by firing off a play to the root timeline.
     * Because of possible video-driven timeline, this play event is asynchronous
     *
     * @alias play
     * @returns {Promise}  A promise that resolves when the animation begins to play
     * @public
     */
    async _play() {
        // NOTE: We have a theory that the `load` call on the audio elements is causing the click event to lose a tie to the user interaction
        //       We still have the potential for a race condition if the "play" call happens before a `load` call
        //       This could be completely eliminated if we can eliminate the load call in the media handlers
        try {
            await Promise.all([unlockAudioPool(), unlockAudioContext()]);
        } catch (error) {
            console.error('WaymarkAuthorWebRenderer play was unable to unlock audio playback.', error);
        }

        // Can't play during loading or setup
        if (this._loadingPromise) {
            await this._loadingPromise;
        }
        if (this._setupPromise) {
            await this._setupPromise;
        }
        if (this._stoppingPromise) {
            await this._stoppingPromise;
        }

        // Only play if we are within the duration
        if (this.rootTimeline.currentTime < this.duration) {
            // Unlock the audio for the renderer
            try {
                // Make sure our audio is okay to play
                await this.loadAudioMediaHandlers();
            } catch (error) {
                // If this fails, don't let this hold up playback
                console.error(
                    'WaymarkAuthorWebRenderer play was unable to resume audio playback. This was likely because there was no user interaction before play was called',
                    error,
                );
            }

            try {
                await this.rootTimeline.start();
                // Don't start the ticker until the start promise has resolved, so we don't get a skip on play
                // if the promise takes more than a frame to resolve
                this.previousTickTime = performance.now();
                this.pixiApplication.ticker.start();
                this._isPlaying = true;
                this.emit('playback:play');
            } catch (e) {
                // TODO: Pause the audio/video if the play attempt has thrown an error

                // Slow seek to time requests can cause the play attempt to abort.
                // TODO: Update rootTimeline.play() to wait for the seek to time request to resolve
                // instead of aborting if a seek to time is in progress.
                if (e instanceof PlayError && e.code === playResult.abortedBySeekToTimeRequest) {
                    console.warn(
                        'Play request aborted by seek to seek to time request. The video may not play after the seek to time request has resolved.',
                    );
                    return;
                }

                throw e;
            }
        }
    }

    /**
     * Stops the renderer
     *
     * @alias stop
     * @returns {Promise}  A promise that resolves when the animation has stopped
     * @public
     */
    async _stop() {
        if (this._playingPromise) {
            await this._playingPromise;
        }
        this.pixiApplication.ticker.stop();
        await this.rootTimeline.stop();
        this._isPlaying = false;
        this.frameDifference = 0;
        this.emit('playback:stop');
    }

    /**
     * Turn off the audio for the renderer
     *
     * @public
     */
    mute() {
        this.isMuted = true;
        // Mute the audio for the renderer
        this._masterAudioNode.gain.value = 0.0;
        this.emit('audio:muted');
    }

    /**
     * Turn the audio for the renderer back on
     *
     * @public
     */
    unmute() {
        this.isMuted = false;
        // Unmute the audio for the renderer
        this._masterAudioNode.gain.value = volumeToGain(this._volume);
        this.emit('audio:unmuted');
    }

    /**
     * Advances the current frame on each tick
     *
     * @private
     */
    onTick() {
        (async () => {
            try {
                if (this.executingTickCount) {
                    // console.warn(
                    //   `onTick() called, but onTick() is currently running. Skipping onTick() for frame ${
                    //     this.rootTimeline.currentTime + 1
                    //   }`,
                    // );
                    return;
                }

                this.executingTickCount += 1;

                try {
                    if (!this.rootTimeline || !this.isPlaying || this.rootTimeline.isComplete) {
                        return;
                    }

                    const renderDuration = 1000 / this.videoData.fr;

                    const currentTickTime = performance.now();
                    const {
                        previousTickTime
                    } = this;
                    let nextFrameNumber;
                    if (previousTickTime) {
                        const timeSinceLastTick = currentTickTime - previousTickTime;
                        this.frameDifference += timeSinceLastTick - renderDuration;

                        if (!this.frameDifference) {
                            return;
                        }
                        // Progress 0, 1, or 2 frames
                        // Progress zero frames if the ticker is moving too fast and our built up frameDifference has passed the 33.33ms threshold.
                        // Progress 1 frame if the ticker is operating within our 33.33ms threshold.
                        // Progress 2 frames if the ticker is moving too slow and is more than 33.33ms behind.
                        const frameProgression = Math.max(Math.ceil(this.frameDifference / renderDuration), 0);
                        nextFrameNumber = this.currentTime + frameProgression;

                        // Adjust the stored frameDifference to account for the amount of frames progressed.
                        this.frameDifference += renderDuration * (1 - frameProgression);
                    } else {
                        nextFrameNumber = this.currentTime;
                    }

                    this.previousTickTime = currentTickTime;

                    if (
                        nextFrameNumber > this.duration ||
                        nextFrameNumber === this.rootTimeline.currentTime
                    ) {
                        return;
                    }

                    this.currentTime = nextFrameNumber;

                    await this.rootTimeline.goToTime(nextFrameNumber);
                    const runTime = performance.now() - currentTickTime;
                    if (runTime > renderDuration) {
                        // const errorMessage = `goToTime took ${runTime.toFixed(
                        //   6,
                        // )}ms, but requested to take <= ${renderDuration.toFixed(6)}ms`;
                        // console.warn(errorMessage);
                    }
                } finally {
                    this.executingTickCount -= 1;
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }

    /**
     * Seeks the animation to the given frame number
     * Because of possible video-driven timeline, this seek event is asynchronous
     *
     * @param      {number}   frameNumber  The frame number
     * @returns     {Promise}  A promise that resolves when the animation has seeked to frame
     * @public
     */
    async goToFrame(frameNumber) {
        this.emit('goToFrame:start');

        // Round the frame to a whole number and keep it between 0-duration
        const boundedFrameNumber = Math.max(Math.min(Math.round(frameNumber), this.duration), 0);
        this.currentTime = boundedFrameNumber;

        const isVideoPlaying = this._isPlaying;

        // Because seeking a media layer is done by a variety of different methods based on its current playback state
        // We want to stop it so it always updates the same way every time
        await this.stop();

        await this.rootTimeline.goToTime(boundedFrameNumber);

        // If the video was playing before, make sure to restart it now
        if (isVideoPlaying) {
            await this.play();
        }

        // Force the application to render to assure we are on the correct frame
        // This call is synchronous, and the goToFrame call will resolve as a promise because of the async decorator
        // TODO: Check performance implications of this on scrubbing
        // NOTE: renderApp() calls this.pixiApplication.render() twice. Among other reasons, it appears that we need to
        // when there is a track-matte in the timeline. We experienced a problem of the very beginning of a track matted
        // layer not rendering properly until a subsequent PIXI render. There are current track matte improvements being
        // developed that should make this eventually unnecessary.
        await this.renderApp();

        this.emit('goToFrame:end');
    }

    /**
     * Returns the total duration of the currently setup template
     *
     * @returns     {number}  The duration in frames
     * @public
     */
    get duration() {
        if (!this.rootTimeline) {
            return 0;
        }
        return this.rootTimeline.duration;
    }

    /**
     * Sets the scale of the renderer.
     *
     * @param      {number}  scale   The scale
     * @public
     */
    setScale(scale) {
        if (!this.pixiApplication) {
            throw Error("Cannot scale renderer before calling 'setup'");
        }

        if (scale <= 0) {
            throw Error('Cannot scale renderer below or at 0');
        }

        const {
            width,
            height
        } = this.pixiApplication.renderer.view;
        const scaleChange = scale / this.scale;

        // You need to set the resolution before resize as it factors into the resizing logic
        this.pixiApplication.renderer.resize(width * scaleChange, height * scaleChange);
        this.pixiApplication.stage.scale.set(scale, scale);

        this.pixiApplication.stage.callAllChildren((child) => {
            // Perform update calls on all objects, as some rely on global scale changes
            if (_.isFunction(child[waymarkAuthorCustomProperties.onRendererSetScale])) {
                child[waymarkAuthorCustomProperties.onRendererSetScale].call();
            }
        });

        this.pixiApplication.render();
        this.scale = scale;

        // Update the transform on all of our objects to ensure they are up-to-date
        // (even if they're not visible, which just calling it on the stage itself won't handle)
        this.pixiApplication.stage.callAllChildren((child) => {
            child.updateTransform();
        });
        this.pixiApplication.render();
    }

    /**
     * Find a layer based on a passed predicate function, UUID or ID
     *
     * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
     * @returns {object} The found matching layer data
     * @public
     */
    findLayer(predicate) {
        return findLayerData(this.videoData, predicate);
    }

    /**
     * Filter layers based on a passed predicate function, UUID or ID
     *
     * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
     * @returns {object[]} The found matching layers data
     * @public
     */
    filterLayers(predicate) {
        return filterLayerData(this.videoData, predicate);
    }

    /**
     * Find a layer based on a passed predicate function, UUID or ID. Similar to `findLayer` but returns the matching pixi object instead
     *
     * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
     * @returns {DisplayObject} The found matching layer
     */
    findLayerObject(predicate) {
        let predicateExpression = predicate;
        if (_.isString(predicate)) {
            // An expression of `#myIdName` searches for a layer id
            if (predicate[0] === '#') {
                predicateExpression = {
                    waymarkId: predicate.slice(1)
                };
                // Otherwise it's a layer uuid
            } else {
                predicateExpression = {
                    waymarkUUID: predicate
                };
            }
        }

        return this.pixiApplication ? .stage ? .findChild(predicateExpression, true);
    }

    /**
     * Filter layers based on a passed predicate function, UUID or ID. Similar to `filterLayers` but returns the matching pixi object instead
     *
     * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
     * @returns {DisplayObject[]} The found matching layers
     * @private
     */
    filterLayerObjects(predicate) {
        let predicateExpression = predicate;
        if (_.isString(predicate)) {
            // An expression of `#myIdName` searches for a layer id
            if (predicate[0] === '#') {
                predicateExpression = {
                    waymarkId: predicate
                };
                // Otherwise it's a layer uuid
            } else {
                predicateExpression = {
                    waymarkUUID: predicate
                };
            }
        }

        return this.pixiApplication.stage.filterChildren(predicateExpression, true);
    }

    /**
     * A debug method that adds the canvas to the document body
     *
     * @private
     */
    debugAddViewToBody() {
        document.body.appendChild(this.pixiApplication.view);
    }

    /**
     * Debugging helper function -- get display object based on the layer name.
     *
     * @param   {string} name  The name of the object
     * @returns {PIXI.DisplayObject|null} The found display object
     * @private
     */
    debugGetDisplayObjectByName(name) {
        return _.find(this.pixiApplication.stage.children, {
            name
        }) || null;
    }

    /**
     * Renders the root timeline and pixi application.
     *
     * NOTE: Due to multiple calls to pixiApplication.render, if this is called at 60fps, we will
     *       have to conditionally remove the double render call
     *
     * @private
     */
    async renderApp() {
        this.emit('frameRender:start', {
            frameNumber: this.rootTimeline.currentTime,
        });

        await this.rootTimeline.render();

        // Ensure that the PixiJS canvas is updated with the new values.
        this.pixiApplication.render();

        this.emit('frameRender:end', {
            frameNumber: this.rootTimeline.currentTime,
        });
    }

    /**
     * Apply a change to the the renderer. Supported operations and required payloads
     * are located in the changeOperations directory.
     *
     * @alias applyChange
     * @param   {string}   type                      - Change type
     * @param   {object}   payload                   - Change payload
     * @param   {object}   options                   - Apply Change options
     * @param   {boolean}  options.shouldUpdateStage - Optional should update stage
     * @returns {Promise}  A promise that resolves when the change has been applied
     */
    async _applyChange(type, payload, options = {
        shouldUpdateStage: true
    }) {
        this.emit('applyChange:start');
        this._isLoading = true;
        const {
            shouldUpdateStage
        } = options;
        const changeOperation = this.createChangeOperation({
            type,
            payload
        });
        await changeOperation.updateManifest();
        await loadAllAssets(changeOperation.getAssetsToLoad());
        if (shouldUpdateStage) {
            await changeOperation.updateStage();
            await this.renderApp();
        }
        this._isLoading = false;
        this.emit('applyChange:end');
    }

    /**
     * Creates an instance of a change operation base on the type and payload passed
     *
     * @param {object} options Change operation options
     * @param {string} options.type The string identifier for the change operation
     * @param {payload} options.payload The change operation payload
     * @returns {ChangeOperations} The newly created change operation
     * @private
     */
    createChangeOperation = ({
        type,
        payload
    }) => {
        const changeOperation = new ChangeOperations[type](this, payload);
        return changeOperation;
    };

    /**
     * Apply a list of changes together before rendering the results. Helps reduce the
     * number of calls to `render` made for full configuration changes, or single user edits
     * that require changes to multiple objects.
     *
     * @alias applyChangeList
     * @param  {object[]} changesList An array of change objects of the form { type, payload }
     * @param  {object} options Options
     * @param  {boolean} options.shouldUpdateStage  Should this change list cause an update to the renderer or just the videoData?
     * @returns {Promise}  A promise that resolves when the changes have been applied
     */
    async _applyChangeList(changesList, options = {
        shouldUpdateStage: true
    }) {
        this.emit('applyChangeList:start');
        this._isLoading = true;
        const {
            shouldUpdateStage
        } = options;
        const layerChanges = {};
        const layerChangeOperations = {};
        const nonlayerChanges = [];
        const nonlayerChangeOperations = [];
        const assetsToLoad = [];

        changesList.forEach((change) => {
            if (change.payload.layer && change.type !== 'FONT_PROPERTY') {
                const {
                    layer
                } = change.payload;
                if (!(layer in layerChanges)) {
                    layerChanges[layer] = [];
                    layerChangeOperations[layer] = [];
                }

                layerChanges[layer].push(change);
            } else {
                nonlayerChanges.push(change);
            }
        });

        // We want to run each layer's manifest change operation sequentially so there aren't
        // conflicts that arise due to race conditions and simultaneous work.
        // We are free, however, to update all of the layers in parallel
        const runUpdateManifest = async (layer) => {
            const changes = layerChanges[layer];
            const changeOperations = changes.map(this.createChangeOperation);
            layerChangeOperations[layer] = changeOperations;

            const updateManifestOperations = changeOperations.map(async (changeOperation) => {
                await changeOperation.updateManifest();
                // Now that we've updated the manifest, add the assets we're supposed to load for it to the array
                const assets = changeOperation.getAssetsToLoad() || [];
                assetsToLoad.push(...assets);
            });
            await Promise.all(updateManifestOperations);
        };

        // Update all of the manifests for each layer
        await Promise.all(Object.keys(layerChanges).map(runUpdateManifest));

        const nonLayerManifestOperations = nonlayerChanges.map(async (change) => {
            const changeOperation = this.createChangeOperation(change);
            nonlayerChangeOperations.push(changeOperation);
            /* eslint-disable no-await-in-loop */
            await changeOperation.updateManifest();
            const assets = changeOperation.getAssetsToLoad() || [];
            assetsToLoad.push(...assets);
        });

        await Promise.all(nonLayerManifestOperations);

        // Now that the manifest has been fully updated, load the assets
        await loadAllAssets(assetsToLoad);

        // Only update the stage if requested
        if (shouldUpdateStage) {
            // Again, we want to run each layer's stage change sequentially similar to the manifest update
            const runUpdateStage = async (layer) => {
                const changeOperations = layerChangeOperations[layer];

                const updateStageOperations = changeOperations.map(
                    (changeOperation) => changeOperation.updateStage,
                );
                for (let i = 0; i < updateStageOperations.length; i += 1) {
                    /* eslint-disable-next-line no-await-in-loop */
                    await updateStageOperations[i]();
                }
            };

            await Promise.all(Object.keys(layerChanges).map(runUpdateStage));

            const nonLayerStageOperations = nonlayerChangeOperations.map((changeOperation) =>
                changeOperation.updateStage(),
            );

            await Promise.all(nonLayerStageOperations);

            await this.renderApp();
        }

        this._isLoading = false;
        this.emit('applyChangeList:end');
    }

    /**
     * Load all of a renderer's Audio Media Handlers
     *
     * @private
     */
    async _loadAudioMediaHandlers() {
        // We cannot load them until the renderer is fully setup
        if (this._setupPromise) {
            await this._setupPromise;
        }
        if (!this.isSetup) {
            return;
        }
        this._isLoading = true;

        const {
            isPlaying
        } = this;
        if (isPlaying) {
            await this.stop();
        }

        try {
            const unloadedHandlers = this._audioMediaHandlers.filter((handler) => !handler.isLoaded);
            await Promise.all(unloadedHandlers.map((audioMediaHandler) => audioMediaHandler.load()));
        } catch (error) {
            console.error('Unable to load AudioMediaHandlers: ', error);
        }
        this._isLoading = false;

        // Restart the player if it was going
        if (isPlaying) {
            await this.play();
        }
    }

    /**
     * onRequestAnimationFrame handler. This will measure the time between
     * calls to get an accurate FPS measurement.
     *
     * @private
     */
    onRequestAnimationFrame = () => {
        const currentUpdateTime = (performance || new Date()).now();

        if (this.lastFrameUpdateTime && this.lastFrameUpdateTime !== currentUpdateTime) {
            const renderDuration = currentUpdateTime - this.lastFrameUpdateTime;
            this.realFPS = 1000 / renderDuration;

            this.emit('updateRealFPS', {
                realFPS: this.realFPS,
                beginRenderTime: this.lastFrameUpdateTime,
                endRenderTime: currentUpdateTime,
            });
        }

        this.lastFrameUpdateTime = currentUpdateTime;

        if (this.shouldTick) {
            requestAnimationFrame(this.onRequestAnimationFrame);
        } else {
            this.lastFrameUpdateTime = null;
        }
    };
}

// Wrapping async class methods in single held promises.
createHeldPromise(WaymarkAuthorWebRenderer, '_setup', 'setup');
createHeldPromise(WaymarkAuthorWebRenderer, '_play', 'play');
createHeldPromise(WaymarkAuthorWebRenderer, '_stop', 'stop');
createHeldPromise(WaymarkAuthorWebRenderer, '_loadAudioMediaHandlers', 'loadAudioMediaHandlers');
createHeldPromise(WaymarkAuthorWebRenderer, '_applyChange', 'applyChange');
createHeldPromise(WaymarkAuthorWebRenderer, '_applyChangeList', 'applyChangeList');

// Global settings
Object.defineProperty(settings, 'IS_DEBUGGING_ENABLED', {
    get: function get() {
        return this._isDebug;
    },
    set: function set(value) {
        if (value === this._isDebug) {
            return;
        }

        if (value) {
            WaymarkAuthorWebRenderer.debugger ? .setupRendererDebugging();
            WaymarkAuthorWebRenderer.debugger ? .showDebuggingPanel();
            WaymarkAuthorWebRenderer.debugger ? .showPerformancePanel();
        } else {
            WaymarkAuthorWebRenderer.debugger ? .teardownRendererDebugging();
            WaymarkAuthorWebRenderer.debugger ? .hideDebuggingPanel();
            WaymarkAuthorWebRenderer.debugger ? .hidePerformancePanel();
        }

        this._isDebug = value;
    },
});

/**
 * Clears the cached value of `analyzeSupport`. Only really useful for testing.
 *
 * @example
 * ```
 * WaymarkAuthorWebRenderer.analyzeSupport.clearCache()
 * ```
 *
 * @private
 */
WaymarkAuthorWebRenderer.analyzeSupport.clearCache = () => {
    support = undefined;
};

/**
 * @memberof WaymarkAuthorWebRenderer
 * @public
 */
// WaymarkAuthorWebRenderer.version = CURRENT_PACKAGE_VERSION;
/**
 * @memberof WaymarkAuthorWebRenderer
 * @public
 */
WaymarkAuthorWebRenderer.settings = settings;
/**
 * @memberof WaymarkAuthorWebRenderer
 * @public
 */
WaymarkAuthorWebRenderer.loader = Loader.shared;

/**
 * Updates the outline object to draw the bounds of the passed display object
 *
 * @param      {pixijs.DisplayObject}  displayObject         The displayObject
 * @param      {pixijs.Graphics}  outlineObject  The displayObject's outline shape
 */
export function updateObjectOutline_TEMP(displayObject, outlineObject) {
    // We are going to loop through each parent and if any parent is `renderable:false` then we will make the outline
    // not visible. But, there's still a bug (noted below).
    let isRendered = displayObject.renderable;
    // NOTE: There is a weird behavior sometimes where a CompositionContainer can be `renderable:false` but
    // the child still renders. This means the bounding box won't show up. Check ibex_realestate15_16x9.default and the legal text
    // in the outro card for an example of this.
    displayObject.forEachParent((parent) => {
        isRendered = isRendered && parent.renderable;
    });
    outlineObject.visible = isRendered;

    // Clear out drawing data
    outlineObject.clear();

    if (!displayObject.worldVisible || displayObject.worldAlpha === 0) {
        return;
    }

    const boxWidth = displayObject.style.wordWrapWidth;
    const boxHeight = displayObject.style.wordWrapHeight;
    const bounds = new Rectangle(
        displayObject.style.textBoxPosition.x,
        displayObject.style.textBoxPosition.y,
        boxWidth,
        boxHeight,
    );

    // Because the outline object is added as a child to the root composition,
    // it will inherit the root composition's transforms (ex: if it is scaled).
    // We remove that transform here before adding it as a child, so it is not applied twice.
    const displayObjectTransform = displayObject.worldTransform.clone();
    const rootComposition = displayObject.getRootParent();
    const rootCompositionTransform = rootComposition.worldTransform.clone();
    rootCompositionTransform.invert();
    displayObjectTransform.prepend(rootCompositionTransform);
    bounds.transformRectangle(displayObjectTransform);

    // Create a light blue box
    const outlinePadding = 20;
    outlineObject.lineStyle(3, 0x00ffff);
    outlineObject.drawRect(
        bounds.x - outlinePadding,
        bounds.y - outlinePadding,
        bounds.width + 2 * outlinePadding,
        bounds.height + 2 * outlinePadding,
    );
}

/**
 * Creates an outline object to show the bounds of a DisplayObject.
 *
 * @param      {pixijs.displayObject}      displayObject  The display object
 * @param      {WaymarkAuthorWebRenderer}  renderer       The renderer
 * @return     {Promise}
 */
// eslint-disable-next-line consistent-return
export async function createOutlineObject_TEMP(displayObject, renderer) {
    /**
     * Only make outlines for objects that
     *  1) Aren't the root stage,
     *  2) Don't already have an outline
     */
    if (displayObject.parent && !displayObject.debugOutlineObject) {
        const outlineObject = new Graphics();
        outlineObject.name = `${displayObject.name} Outline`;
        displayObject.debugOutlineObject = outlineObject;
        // Start the object off with a correct draw
        updateObjectOutline_TEMP(displayObject, outlineObject);
        // Add the outline as a sibling to the displayObject
        renderer.pixiApplication.stage.addChild(outlineObject);
        // Whenever the object updates, update the outline object
        const updateObjectOutlineHook = updateObjectOutline_TEMP.bind(
            null,
            displayObject,
            outlineObject,
        );
        displayObject.updateObjectOutlineHook = updateObjectOutlineHook;
        if (displayObject.layerTimeline) {
            displayObject.layerTimeline.registerHookCallback(
                Timeline.hookNames.afterPropertiesRender,
                updateObjectOutlineHook,
            );
        }

        return renderer.renderApp();
    }
}

/**
 * Removes a DisplayObject's outline object and remove the listeners
 *
 * @param      {pixijs.DisplayObject}      displayObject  The display object
 * @param      {WaymarkAuthorWebRenderer}  renderer       The renderer
 * @return     {Promise}
 */
// eslint-disable-next-line consistent-return
export async function removeOutlineObject_TEMP(displayObject, renderer) {
    if (displayObject.debugOutlineObject) {
        renderer.pixiApplication.stage.removeChild(displayObject.debugOutlineObject);
        displayObject.debugOutlineObject = null;
        if (displayObject.layerTimeline) {
            displayObject.layerTimeline.removeHookCallback(
                'onUpdate',
                displayObject.updateObjectOutlineHook,
            );
        }
        return renderer.renderApp();
    }
}

export default WaymarkAuthorWebRenderer;
/* eslint-enable no-underscore-dangle jsdoc/no-undefined-types */