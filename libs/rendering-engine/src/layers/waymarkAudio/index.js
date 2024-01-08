// Local
import {
    createNullFromLayer
} from '../null.js';
import {
    applyLayerAudioProperties,
    applyDisplayObjectProperties,
    applyTimeRemapProperties,
    setDirty,
    loadAssetForLayer,
} from '../utils/index.js';
import {
    getBrowserInfo,
    isiOS
} from '../../utils/index.js';

import {
    Timeline
} from '../../timeline/index.js';
import AudioMediaHandler from './AudioMediaHandler.js';

export {
    AudioMediaHandler
};

const SHOULD_USE_MEDIA_ELEMENT_FOR_AUDIO = getBrowserInfo().browserName !== 'ios';

/**
 * Create Waymark audio from manifest layer data.
 * An animation should only have one Waymark audio layer, which can be
 * modified using the WAYMARK_AUDIO_ASSET editor API endpoint.
 *
 * @param   {object}  layerData       Manifest layer data
 * @param   {object}  assets          Parsed asset objects
 * @param   {object}  timeline        PixiJS timeline
 * @param   {WaymarkAuthorWebRenderer}  renderer The root renderer initiating the layer creation
 * @param   {object}  options.object  [Optional] Target object, or create new object if null
 * @returns  {object}                  Waymark audio layer
 */
/* eslint-disable-next-line import/prefer-default-export */
/**
 * @param layerData
 * @param assets
 * @param timeline
 * @param framesPerSecond
 * @param renderer
 * @param options
 */
export async function createWaymarkAudioFromLayer(
    layerData,
    assets,
    timeline,
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
    let audioMediaHandler;
    if (object) {
        timeline.destroy();
        setDirty(object);
        if (object.audioMediaHandler) {
            ({
                audioMediaHandler
            } = object.audioMediaHandler);
        }
    }

    let layerObject = object;
    if (object) {
        applyDisplayObjectProperties(object, layerData, timeline);
    } else {
        layerObject = createNullFromLayer(layerData, timeline);
    }

    let resource;
    try {
        ({
            resource
        } = await loadAssetForLayer(assets, layerData));
    } catch (error) {
        // Unlike image and video layers, Waymark audio layers should fail gracefully
        // if they do not reference an asset. This is because Waymark audio layers
        // can be created at export time but may not necessarily reference a valid
        // audio file until one has been added via the template studio.
        // These in-between templates still need to be previewable.
        console.error(
            'Waymark audio layer is missing a valid audio file so no background audio will play. A background audio file can be added via the template studio.',
        );

        layerObject.waymarkResource = null;
        layerObject.audioMediaHandler = null;
        // Don't let the old audioMediaHandler continue to play
        if (audioMediaHandler) {
            audioMediaHandler.destroy();
        }

        return layerObject;
    }

    // TODO: DRY this up with the video layer
    applyTimeRemapProperties(layerObject, layerData, timeline);

    const {
        // Timeline frame number where the layer is first shown on screen
        ip: layerInPoint,
        // Timeline frame number where the layer is last shown on screen
        op: layerOutPoint,
        // The frame that the media officially begins at.
        // ex: 30 would mean for the first second the media doesn't play but stays frozen on frames 0-29
        st: mediaStartTime,
    } = layerData;

    // Audio frame number to display at time = 0
    let initialAudioFrameNumber = Math.max(layerInPoint - mediaStartTime, 0);
    let defaultAudioPlaybackRate = 1.0;
    // If we have time remap tweens, our playback rate will change/be different than 1.0
    if (timeline.getPropertyTweens('timeRemap').length) {
        initialAudioFrameNumber =
            timeline.getPropertyValueAtTime('timeRemap', layerInPoint) * framesPerSecond;

        // Get the playrate velocity at this first frame
        const audioStartTime = timeline.getPropertyValueAtTime('timeRemap', currentTime);
        const audioEndTime = timeline.getPropertyValueAtTime('timeRemap', currentTime + 1);

        // Any value other than 1.0 will otherwise compress/lengthen the Audio playback
        defaultAudioPlaybackRate = (audioEndTime - audioStartTime) * framesPerSecond;
    }

    layerObject.waymarkResource = resource;
    const audioMediaHandlerOptions = {
        shouldUseMediaElement: SHOULD_USE_MEDIA_ELEMENT_FOR_AUDIO,
        defaultPlaybackRate: defaultAudioPlaybackRate,
    };

    if (audioMediaHandler) {
        audioMediaHandler.setResource(resource);
        audioMediaHandler.setOptions(audioMediaHandlerOptions);
    } else {
        audioMediaHandler = new AudioMediaHandler(resource, renderer, audioMediaHandlerOptions);
    }

    if (!isiOS()) {
        try {
            await audioMediaHandler.load();
            // We don't want a failed audio load to stop template setup or playback
        } catch (e) {
            console.error('Waymark audio layer failed to load: ', e);
        }
    }

    applyLayerAudioProperties(layerObject, layerData, audioMediaHandler, timeline);
    layerObject.audioMediaHandler = audioMediaHandler;

    // True when the timeline is "playing", false when paused and the timeline is being manually seeked
    layerObject.shouldPlayAudio = false;

    layerObject.beforeStartHook = async () => {
        layerObject.shouldPlayAudio = true;
    };
    timeline.registerHookCallback(Timeline.hookNames.beforeStart, layerObject.beforeStartHook);

    layerObject.beforeStopHook = async () => {
        layerObject.shouldPlayAudio = false;
        return audioMediaHandler.stop();
    };
    timeline.registerHookCallback(Timeline.hookNames.beforeStop, layerObject.beforeStopHook);

    layerObject.renderingHook = async () => {
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
            if (audioMediaHandler.playbackRate && playbackRate === 0) {
                audioMediaHandler.stop();
            }

            // Only change the playback rate if it is different enough.
            // This is because frequent playback rate adjustments can cuase audio/video playback interruptions
            if (Math.abs(playbackRate - audioMediaHandler.playbackRate) > 0.05) {
                audioMediaHandler.playbackRate = playbackRate;
            }
        } else {
            const timeElapsed = timeline.currentTime - mediaStartTime;
            contentCurrentFrameNumber = Math.round(initialAudioFrameNumber + timeElapsed);
        }

        // Don't attempt to sync to a frame if we're after the last frame the layer is on screen.
        if (timeline.currentTime > layerOutPoint && audioMediaHandler.isPlaying) {
            audioMediaHandler.stop();
        } else {
            audioMediaHandler.seekToFrame(contentCurrentFrameNumber);
        }
    };
    timeline.registerHookCallback(Timeline.hookNames.rendering, layerObject.renderingHook);

    // eslint-disable-next-line consistent-return
    layerObject.afterPropertiesRenderHook = async () => {
        if (layerObject.shouldPlayAudio) {
            try {
                await audioMediaHandler.play();
            } catch (error) {
                console.error('Audio playback error: ', error);
            }
        }
    };
    timeline.registerHookCallback(
        Timeline.hookNames.afterPropertiesRender,
        layerObject.afterPropertiesRenderHook,
    );

    layerObject.onCompleteHook = () => (audioMediaHandler.isLoaded ? audioMediaHandler.stop() : null);
    timeline.registerHookCallback(Timeline.hookNames.complete, layerObject.onCompleteHook);

    // Make sure the timeline's (and its children's) current time is the same if we had to destroy it earlier
    // eslint-disable-next-line no-param-reassign
    timeline.currentTime = currentTime;

    return layerObject;
}