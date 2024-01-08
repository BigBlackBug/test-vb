/* eslint-disable jsdoc/no-undefined-types */
// Vendor
import {
    Sprite
} from 'pixi.js';
// Local
import {
    Timeline
} from '../../timeline/index.js';
import settings, {
    timeSyncVideoSeekMode
} from '../../settings.js';
import {
    getContentPropertiesFromLayerData
} from '../../manifest/index.js';
import {
    applyDisplayObjectProperties,
    applyLayerAudioProperties,
    applyTimeRemapProperties,
    applyMediaLayerModifications,
    defaultVideoMediaModifications,
    loadAssetForLayer,
    setDirty,
} from '../utils/index.js';

import {
    VideoMediaHandler
} from './VideoMediaHandler.js';

export {
    VideoMediaHandler
};

/**
 * Create video from an exported layer payload.
 *
 * @param      {object}       layerData        Exported layer payload
 * @param      {object[]}     assets           Array of parsed assets
 * @param      {object}       timeline         Greensock timeline
 * @param      {PIXI.Application}  pixiApplication  The pixi application
 * @param      {number}       framesPerSecond  The frames per second of the video layer (currently the same as the renderer)
 *                                             TODO: This ideally would be be the framerate of the video itself, but that's for future work
 * @param      {WaymarkAuthorWebRenderer}       renderer  The renderer initiating the layer creation
 * @param      {object}       [options={}]     The options
 * @returns     {Promsie}  A promise that resolves on layer creation with a Pixi.js sprite object
 */
export async function createWaymarkVideoFromLayer(
    layerData,
    assets,
    timeline,
    pixiApplication,
    framesPerSecond,
    renderer,
    options = {},
) {
    const {
        currentTime
    } = timeline;
    const {
        object
    } = options;
    let videoMediaHandler;
    let sprite;
    if (object) {
        timeline.removeAllTweens();
        setDirty(object);
        sprite = object;
        if (sprite.videoMediaHandler) {
            ({
                videoMediaHandler
            } = sprite);
        }
    } else {
        sprite = new Sprite();
    }

    applyTimeRemapProperties(sprite, layerData, timeline);

    const {
        resource,
        asset
    } = await loadAssetForLayer(assets, layerData);

    const {
        // Timeline frame number where the layer is first shown on screen
        ip: layerInPoint,
        // Timeline frame number where the layer is last shown on screen
        op: layerOutPoint,
        // The frame that the media officially begins at.
        // ex: 30 would mean for the first second the media doesn't play but stays frozen on frames 0-29
        st: mediaStartTime,
    } = layerData;

    // Video frame number to display at time = 0
    let initialVideoFrameNumber = Math.max(layerInPoint - mediaStartTime, 0);
    let defaultVideoPlaybackRate = 1.0;
    // If we have time remap tweens, our playback rate will change/be different than 1.0
    if (timeline.getPropertyTweens('timeRemap').length) {
        initialVideoFrameNumber =
            timeline.getPropertyValueAtTime('timeRemap', layerInPoint) * framesPerSecond;

        // Get the playrate velocity at this first frame
        const videoStartTime = timeline.getPropertyValueAtTime('timeRemap', currentTime);
        const videoEndTime = timeline.getPropertyValueAtTime('timeRemap', currentTime + 1);

        // Any value other than 1.0 will otherwise compress/lengthen the video playback
        defaultVideoPlaybackRate = (videoEndTime - videoStartTime) * framesPerSecond;
    }

    if (Object.keys(asset.modifications || {}).length) {
        // console.warn(
        //   `Asset (${asset.id}) has a modification object present. Asset modifications are currently not recommended.`,
        // );
    }

    const layerContentProperties = getContentPropertiesFromLayerData(layerData);

    // Specific layerData modifications take precedence over asset modifications
    const modifications = {
        ...defaultVideoMediaModifications,
        ...asset.modifications,
        // TODO: Remove this when change operations are updated
        ...layerData.modifications,
        ...layerContentProperties,
    };

    const videoMediaHandlerOptions = {
        assetWidth: asset.w,
        assetHeight: asset.h,
        displayWidth: layerData.w,
        displayHeight: layerData.h,
        renderer: pixiApplication.renderer,
        framerate: framesPerSecond,
        defaultPlaybackRate: defaultVideoPlaybackRate,
    };

    if (videoMediaHandler) {
        videoMediaHandler.setResource(resource);
        videoMediaHandler.setModifications(modifications);
        videoMediaHandler.setOptions(videoMediaHandlerOptions);
    } else {
        // If we don't have a defined asset width/height, we assume that it's for this sprite instance.
        videoMediaHandler = new VideoMediaHandler(
            resource,
            renderer,
            modifications,
            videoMediaHandlerOptions,
        );
    }

    try {
        await videoMediaHandler.setup();
    } catch (e) {
        console.error('VideoMediaHandler failed to setup for video. Unable to playback.', e);
        return sprite;
    }

    const {
        texture,
        scaledTimecodeSettings,
        hasTimecode,
        audioMediaHandler
    } = videoMediaHandler;

    if (
        hasTimecode &&
        scaledTimecodeSettings &&
        scaledTimecodeSettings.timecodePlacement !== 'bottom'
    ) {
        throw new Error(
            `Timecode placement "${scaledTimecodeSettings.timecodePlacement}" is unsupported. Please use "bottom".`,
        );
    }

    // Update the Sprite with the new texture
    sprite.texture = texture;
    sprite.videoMediaHandler = videoMediaHandler;

    // applyMediaLayerModifications needs to go above applyDisplayObjectProperties so the `mediaRedraw` property is present, allowing blend modes to work correctly
    // Apply the modifications from the asset and layerData
    applyMediaLayerModifications(sprite, modifications, texture.orig);
    applyDisplayObjectProperties(sprite, layerData, timeline);

    applyLayerAudioProperties(sprite, layerData, audioMediaHandler, timeline);
    sprite.audioMediaHandler = audioMediaHandler;

    // True when the timeline is "playing", false when paused and the timeline is being manually seeked
    sprite.shouldPlayVideo = false;

    // Calling videoMediaHandler.play() takes a while, and we don't want to call it multiple times
    // if it takes longer than a single frame.
    let isAttemptingToPlayVideo = false;

    let backgroundSeekToTimeTask = null;
    let backgroundSeekToTimeTaskError = null;

    /**
     * Seek-to-time operation that runs in the background. The response from this method can be
     * awaited. Only one backgroundSeekToTimeRunnable operation may run at a time.
     *
     * WARNING: This will not throw an exception. Use verifyBackgroundSeekToTimeTaskResolved to check
     * for exceptions.
     *
     * @param {integer} frameNumber The frame to attemp to seek to
     * @returns {Promise} Promise that resolves on completion of a verified seek to time operation
     */
    const backgroundSeekToTimeRunnable = (frameNumber) =>
        (async () => {
            try {
                // timeSyncVideoSeekMode.accurate verifies that the video is seeked to the exact requested frame.
                // This may require readjusting the video time, which seekVideoToFrame will do automatically and
                // can be a time consuming process.
                // timeSyncVideoSeekMode.fast skips the frame verification.
                if (settings.TIME_SYNC_VIDEO_SEEK_MODE === timeSyncVideoSeekMode.accurate) {
                    const targetFrameNumber = Math.min(
                        frameNumber,
                        sprite.videoMediaHandler.maximumFrameNumber,
                    );
                    await sprite.videoMediaHandler.seekToFrame(targetFrameNumber);
                } else {
                    const targetFrameNumber = Math.min(
                        frameNumber,
                        sprite.videoMediaHandler.maximumFrameNumber,
                    );
                    const {
                        actualFrameNumber,
                        resolvedFrameNumber,
                        step
                    } =
                    await sprite.videoMediaHandler.syncToFrame(targetFrameNumber);
                    timeline.emit('afterSyncToFrameCalled', {
                        requestedFrameNumber: frameNumber,
                        actualFrameNumber,
                        resolvedFrameNumber,
                        sprite,
                        step,
                    });
                }

                sprite.texture.update();
                sprite.emit('onUpdateVideoFrame', frameNumber);
            } catch (error) {
                // Store exceptions in an error instead of throwing them so that they can be caught and
                // handled from the parent thread.
                backgroundSeekToTimeTaskError = error;
            }
        })();

    /**
     * Check for exceptions from backgroundSeekToTimeRunnable(frameNumber).
     */
    const verifyBackgroundSeekToTimeTaskResolved = () => {
        if (backgroundSeekToTimeTaskError) {
            backgroundSeekToTimeTask = null;
            const {
                message
            } = backgroundSeekToTimeTaskError;
            backgroundSeekToTimeTaskError = null;

            throw new Error(`Background seek to time error: ${message}`);
        }
    };

    const onFrame = async () => {
        verifyBackgroundSeekToTimeTaskResolved();
        if (isAttemptingToPlayVideo) {
            return;
        }

        // Actual frame number of the video to display at timeline.currentTime
        let contentCurrentFrameNumber;

        // If we have time remap tweens, fetch the time from the tween
        if (timeline.getPropertyTweens('timeRemap').length) {
            const contentCurrentTime = timeline.getPropertyValueAtTime('timeRemap', timeline.currentTime);
            contentCurrentFrameNumber = Math.round(contentCurrentTime * framesPerSecond);

            // Get the expected playrate for this frame
            const videoEndTime = timeline.getPropertyValueAtTime('timeRemap', timeline.currentTime + 1);
            const playbackRate = (videoEndTime - contentCurrentTime) * framesPerSecond;

            // If we're going from playing to not playing stop the video
            if (videoMediaHandler.playbackRate && playbackRate === 0) {
                sprite.shouldPlayVideo = false;
                videoMediaHandler.stop();
            }

            // Only change the playback rate if it is different enough.
            // This is because frequent playback rate adjustments can cuase audio/video playback interruptions
            if (Math.abs(playbackRate - videoMediaHandler.playbackRate) > 0.05) {
                videoMediaHandler.playbackRate = playbackRate;
            }
        } else {
            const timeElapsed = timeline.currentTime - mediaStartTime;
            contentCurrentFrameNumber = Math.round(initialVideoFrameNumber + timeElapsed);
        }

        // timeSyncVideoSeekMode.accurate verifies that the video is seeked to the exact requested frame.
        // This may require readjusting the video time, which seekVideoToFrame will do automatically and
        // can be a time consuming process.
        if (settings.TIME_SYNC_VIDEO_SEEK_MODE === timeSyncVideoSeekMode.accurate) {
            const targetFrameNumber = Math.min(
                contentCurrentFrameNumber,
                sprite.videoMediaHandler.maximumFrameNumber,
            );
            await sprite.videoMediaHandler.seekToFrame(targetFrameNumber);
            sprite.texture.update();
            sprite.emit('onUpdateVideoFrame', contentCurrentFrameNumber);
        }
        // timeSyncVideoSeekMode.fast skips the frame verification.
        else {
            if (backgroundSeekToTimeTask) {
                // Wait for background seek to time task to finish before proceeding.
                await backgroundSeekToTimeTask;
                backgroundSeekToTimeTask = null;
                verifyBackgroundSeekToTimeTaskResolved();
            }

            if (timeline.currentTime < mediaStartTime) {
                // The timeline isn't displaying the video yet. Seek the video to the correct time in the
                // background.
                if (!backgroundSeekToTimeTask) {
                    backgroundSeekToTimeTask = backgroundSeekToTimeRunnable(initialVideoFrameNumber);
                    await backgroundSeekToTimeTask;
                    backgroundSeekToTimeTask = null;
                    verifyBackgroundSeekToTimeTaskResolved();
                }
            }

            // Don't attempt to sync to a frame if we're after the last frame the layer is on screen.
            if (timeline.currentTime > layerOutPoint && sprite.videoMediaHandler.isPlaying) {
                sprite.videoMediaHandler.stop();
            } else {
                const targetFrameNumber = Math.min(
                    contentCurrentFrameNumber,
                    sprite.videoMediaHandler.maximumFrameNumber,
                );
                const {
                    actualFrameNumber,
                    resolvedFrameNumber,
                    step
                } =
                await sprite.videoMediaHandler.syncToFrame(targetFrameNumber);
                timeline.emit('afterSyncToFrameCalled', {
                    requestedFrameNumber: contentCurrentFrameNumber,
                    actualFrameNumber,
                    resolvedFrameNumber,
                    sprite,
                    step,
                });
            }

            sprite.texture.update();
            sprite.emit('onUpdateVideoFrame', contentCurrentFrameNumber);

            // We only need to control video playback if it's within the usable frames.
            if (contentCurrentFrameNumber <= sprite.videoMediaHandler.maximumFrameNumber) {
                if (
                    timeline.currentTime >= layerInPoint &&
                    sprite.shouldPlayVideo &&
                    videoMediaHandler.playbackRate &&
                    !sprite.videoMediaHandler.isPlaying
                ) {
                    isAttemptingToPlayVideo = true;
                    try {
                        await sprite.videoMediaHandler.play();
                    } catch (error) {
                        console.error('Video playback error: ', error);
                    } finally {
                        isAttemptingToPlayVideo = false;
                    }
                } else if (timeline.currentTime > layerOutPoint && sprite.videoMediaHandler.isPlaying) {
                    sprite.videoMediaHandler.stop();
                }
            }
        }
    };

    // Only create and register the hooks on initial creation
    if (sprite.hookBeforeStart) {
        timeline.removeHookCallback(Timeline.hookNames.beforeStart, sprite.hookBeforeStart);
    }
    sprite.hookBeforeStart = async () => {
        sprite.shouldPlayVideo = true;
        await onFrame();
    };
    timeline.registerHookCallback(Timeline.hookNames.beforeStart, sprite.hookBeforeStart);

    if (sprite.hookBeforeStop) {
        timeline.removeHookCallback(Timeline.hookNames.beforeStop, sprite.hookBeforeStop);
    }
    sprite.hookBeforeStop = () => {
        sprite.shouldPlayVideo = false;
        sprite.videoMediaHandler.stop();
    };
    timeline.registerHookCallback(Timeline.hookNames.beforeStop, sprite.hookBeforeStop);

    if (sprite.hookRendering) {
        timeline.removeHookCallback(Timeline.hookNames.rendering, sprite.hookRendering);
    }

    sprite.hookRendering = onFrame;
    timeline.registerHookCallback(Timeline.hookNames.rendering, sprite.hookRendering);

    if (sprite.onCompleteHook) {
        timeline.removeHookCallback(Timeline.hookNames.complete, sprite.onCompleteHook);
    }

    sprite.onCompleteHook = () => sprite.hookBeforeStop();
    timeline.registerHookCallback(Timeline.hookNames.complete, sprite.onCompleteHook);

    // Make sure the timeline's (and its children's) current time is the same if we had to destroy it earlier
    // eslint-disable-next-line no-param-reassign
    timeline.currentTime = currentTime;

    return sprite;
}

export {
    seekVideoToFrame
}
from './utils.js';
export {
    PlayError,
    playResult
}
from './VideoMediaHandler.js';
/* eslint-enable jsdoc/no-undefined-types */