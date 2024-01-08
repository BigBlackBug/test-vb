/* eslint-disable no-param-reassign */

// Local
import _ from 'lodash';
import {
    uuid
} from '../utils/index.js';
import {
    findLayerData,
    getPropertyAtTime,
    removeTweenForPropertyAtTime,
    spliceTweensForProperty,
    updateAssetData,
} from '../manifest/index.js';

/**
 * @typedef duckingVolumeChange
 * @param {string} type An internal type, used to identify different ways to perform a change. For this: `targetDucking`
 * @param {string} duckingTarget The UUID of another layer to be used for the start and end times of the change ex: 'asd-123-456'
 * @param {number} targetVolume The volume the audio should duck to ex: `.3`
 */

/**
 * @typedef audioLevelsVolumeChange
 * A proposed (not implemented) volume changes type
 *
 * @param {string} type An internal type, used to identify different ways to perform a change. For this: 'audioLevels'
 * @param {number} volume The volume of the audio ex: .8
 * @param {null|object} ease An ease to describe the change in volume ex: bodymovin compatible ease {"i": {}, "o": {}},
 * @param {number} startFrame Start time in frames ex: `20`
 * @param {number} duration Duration of the change in frames ex: `50`
 */

// A default value that works well for audio ducking
const DEFAULT_DUCKING_VOLUME = 0.3;

// The time (in frames) it takes for the audio to change
const DEFAULT_CHANGE_DURATION = 15;

// A default ease that works well for audio ducking
const DEFAULT_DUCKING_EASE = {
    i: {
        x: [0.72],
        y: [0.37],
    },
    o: {
        x: [0.72],
        y: [0.37],
    },
    n: ['0p72_0p37_0p72_0p37'],
};

const VOLUME_CHANGES_TYPES = {
    targetDucking: 'targetDucking',
    // 'audioLevels',
};

/**
 * Update the asset content for a layer
 *
 * @param {object} layerData The layer data
 * @param {object[]} assets The assets array (from bodymovin)
 * @param {object} payload The payload
 * @param {object} payload.content The payload's content property ex: {type, key, location},
 * @returns {object} The new asset created from the payload
 */
export const updateLayerContentProperty = (layerData, assets, payload) => {
    const {
        content
    } = payload;
    let newAsset;

    // Update the asset (content) associated with this layer
    if (content) {
        newAsset = _.cloneDeep(content);
        if (_.isUndefined(newAsset.id)) {
            // Sometimes we will have a waymark audio layer without a refId
            if (!layerData.refId) {
                layerData.refId = `audio_${uuid()}`;
            }

            newAsset.id = layerData.refId;
        }
        newAsset = updateAssetData(assets, newAsset, true);
        layerData.refId = newAsset.id;
    }

    return newAsset;
};

/**
 * Update the properties on a layer related to its texture
 *
 * @param      {object}  layerData          The layer data
 * @param      {object}  payload            The payload
 * @param      {object}  payload.fitFillAlignment  The texture's alignment (defaults to Center, Center)
 */
export const updateTextureLayerProperties = (layerData, payload) => {
    // Add content properties from the payloiad
    layerData.contentBackgroundFill = payload.contentBackgroundFill;
    layerData.contentCropping = payload.contentCropping;
    layerData.contentPadding = payload.contentPadding;
    layerData.contentFit = payload.contentFit;
    layerData.contentZoom = payload.contentZoom;
    layerData.contentFitFillAlignment = payload.contentFitFillAlignment || payload.fitFillAlignment;

    if (payload.fitFillAlignment) {
        console.warn(
            'fitFillAlignment on layerData has been depreciated, please use contentFitFillAlignment',
        );
    }
};

/**
 * Update media control properties on a layer
 *
 * payload: {
 *   isMuted: true,
 *   volume: .8,
 *   volumeChanges: [{
 *       type: 'targetDucking'
 *       duckingTarget: '[UUID]',
 *       targetVolume: .3
 *   }, {
 *       // TODO: Future Option?
 *       type: 'audioLevels',
 *       volume: .8, // The volume of the audio
 *       ease: null (DEFAULT_DUCKING_EASE) || bodymovin compatible ease {"i": {}, "o": {}},
 *       startFrame: 20, // Start time in frames
 *       duration: 50, // Duration of the change in frames
 *   }]
 *  }
 *
 * @param      {object}   layerData          The layer data
 * @param      {object}   projectManifest    The whole project manifest from bodymovin
 * @param      {object}   payload            The payload
 * @param      {number}   payload.volume     The overall (Master) volume for an audio layer
 * @param      {number}   payload.isMuted    If the audio overall is muted
 * @param      {object[]} payload.volumeChanges   An array of changes to the volume (used for ducking, fade outs, etc)
 * @param      {string}   payload.volumeChanges.type     An internal type, used to identify different ways to perform a change. Currently only valid option is 'targetDucking'
 * @param      {string}   payload.volumeChanges.duckingTarget     Another layer to be used for the start and end times of the change
 * @param      {number}   payload.volumeChanges.targetVolume      The volume the audio should duck to
 */
export const updateMediaLayerProperties = (layerData, projectManifest, payload) => {
    const {
        isMuted,
        modifications,
        volume,
        volumeChanges = []
    } = payload;

    // Update modifications if supplied
    if (!_.isUndefined(modifications)) {
        layerData.modifications = payload.modifications;
    }

    // Update isMuted
    if (!_.isUndefined(isMuted)) {
        layerData.isMuted = isMuted;
    }

    // Update the master audio level
    if (!_.isUndefined(volume)) {
        layerData.masterVolume = volume;
    }

    let tweens = [];
    volumeChanges.forEach((volumeChange) => {
        switch (volumeChange.type) {
            case VOLUME_CHANGES_TYPES.targetDucking:
                {
                    // If we have a ducking layer, use that as the basis for the tween
                    const duckingTarget = findLayerData(projectManifest, volumeChange.duckingTarget);

                    if (!duckingTarget) {
                        throw Error(`Could not find ducking layer ${volumeChange.duckingTarget}`);
                    }

                    const startFrame = duckingTarget.ip;
                    const duration = duckingTarget.op - duckingTarget.ip;

                    let startingVolume;
                    try {
                        startingVolume = getPropertyAtTime(layerData, 'volume', startFrame);
                    } catch (e) {
                        // if we don't have a property, it's because it's not included by default in the bodymovin export
                        startingVolume = 1;
                    }

                    const {
                        targetVolume = DEFAULT_DUCKING_VOLUME
                    } = volumeChange;

                    // Construct the tweens for the audio ducking
                    // The first tween (when the volume decreases)
                    const duckingOutTween = {
                        ...DEFAULT_DUCKING_EASE,
                        s: [startingVolume],
                        e: [targetVolume],
                        t: startFrame,
                    };

                    // The tween for when the volume is decreased
                    const holdTween = {
                        s: [targetVolume],
                        h: 1,
                        t: startFrame + DEFAULT_CHANGE_DURATION,
                    };

                    // The tween for when the volume is increased back to the normal volume
                    const duckingInTween = {
                        ...DEFAULT_DUCKING_EASE,
                        s: [targetVolume],
                        e: [startingVolume],
                        t: startFrame + duration - DEFAULT_CHANGE_DURATION,
                    };

                    // A Tween to set the duration of the duckingInTween
                    const durationTween = {
                        t: startFrame + duration,
                    };

                    tweens = [duckingOutTween, holdTween, duckingInTween, durationTween];
                    if (!layerData.volume) {
                        layerData.volume = {
                            a: 0,
                            k: [startingVolume],
                        };
                    }

                    // Remove tweens that already existed at these times
                    tweens.forEach(({
                        t
                    }) => {
                        removeTweenForPropertyAtTime(layerData, 'volume', t);
                    });
                    // Now add the new tweens
                    spliceTweensForProperty(layerData, 'volume', tweens);
                    break;
                }
            default:
                {
                    console.error(`Change operation for layer ${payload.layer} requires a volumeChange type`);
                    break;
                }
        }
    });
};

export const PLAYBACK_CONTROL_TYPE = {
    // Stretches or shrinks the content to fit the layer's duration
    fitDuration: 'fitDuration',
    // Holds the last frame if the layer's duration is too short
    holdEndFrame: 'holdEndFrame',
};

/**
 * Update control properties on a layer that has a time dimension (Video, Audio, Pre-Compositions)
 *
 *  payload: {
 *   contentTrimStartTime: 3.3,
 *   contentTrimDuration: 9.5,
 *   contentPlaybackDuration: 250,
 *   // not implemented
 *   contentLoopType: one of ['none', 'loop', 'bounce'] default: 'none'
 *  }
 *
 * @param      {object}  layerData  The layer data
 * @param      {object}  payload    The payload
 * @param      {number}  payload.contentTrimStartTime     The frame the video should start at (in seconds)
 * @param      {number}  payload.contentTrimDuration      The duration of the video in seconds (if less than the layer duration, it will be played back slower, greater than played back faster)
 * @param      {number}  payload.contentPlaybackDuration  Changes the playback rate of the video inside the layer in frames (how long in the layer timeline it should take).
 * Longer times than duration will slow the playback rate, shorter times will speed up the playback rate.
 * @param      {number}  framerate  The framerate of the template
 */
export const updateLayerContentTimeProperties = (layerData, payload, framerate = 30) => {
    const {
        ip: layerInPoint,
        op: layerOutPoint
    } = layerData;
    const layerDuration = layerOutPoint - layerInPoint;

    // Trim
    // Because contentTrimDuration is in seconds, for the default we must divide the layerDuration by the framerate
    const {
        contentTrimStartTime = 0, contentTrimDuration = layerDuration / framerate
    } = payload;
    // The default should be the length of the trimmed video.
    // Because contentPlaybackDuration is in frames, for the default we must multiply contentTrimDuration by the framerate
    const {
        contentPlaybackDuration = contentTrimDuration * framerate
    } = payload;

    const contentEndTime = contentTrimStartTime + contentTrimDuration;

    const tweens = [];

    const timeRemapTween = {
        s: [contentTrimStartTime],
        e: [contentEndTime],
        t: layerInPoint,
    };

    const outTween = {
        // By default, the final frame will be held if the contentTrimDuration is less than the layer's duration
        t: layerInPoint + contentPlaybackDuration,
    };

    tweens.push(timeRemapTween, outTween);

    // Remove all time remapping tweens
    // TODO: When we have better rules around this we may want to be more selective
    delete layerData.tm;
    // Now add the new tweens
    spliceTweensForProperty(layerData, 'tm', tweens);
};