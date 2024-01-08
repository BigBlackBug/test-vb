import _ from 'lodash';
import {
    getAudioContext
} from './utils/index.js';

/**
 * The AudioElementPool holds a set of audio elements that are unlocked via a user interaction
 * Users of the audio pool can claim elements for use and release then on their own.
 */
export class AudioElementPool {
    static silenceDataURL =
        'data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

    // Unlock HTML5 Audio - load a data url of short silence and play it
    // This will also allow us to play web audio when the mute toggle is on
    static async unlockAudioElement(element) {
        /* eslint-disable no-param-reassign, no-underscore-dangle */
        element.controls = false;
        element.preload = 'auto';
        element.loop = false;
        // If this element already has a source, cache it while we unlock with the silent audio
        const trueSrc = element.src;
        element.src = AudioElementPool.silenceDataURL;
        let wasSuccessful = false;
        try {
            await element.play();
            element.pause();
            // Add a property to the element so we know it is now unlocked
            // eslint-disable-next-line no-underscore-dangle
            element._isUnlocked = true;
            wasSuccessful = true;
        } catch (error) {
            wasSuccessful = false;
        } finally {
            // Return the element source
            element.src = trueSrc;
        }
        return wasSuccessful;
        /* eslint-enable no-param-reassign, no-underscore-dangle */
    }

    constructor(defaultAudioPoolCount = 10) {
        this.audioPool = [];
        this.claimedAudioPool = [];

        for (let i = defaultAudioPoolCount; i > 0; i -= 1) {
            this.audioPool.push(document.createElement('audio'));
        }
    }

    /**
     * Unlock all of the audio pool elements that are still locked
     */
    async unlockAllAudio() {
        let unlockAudioAttempts = [];
        try {
            const lockedElements = [
                /* eslint-disable no-underscore-dangle */
                ...this.audioPool.filter((element) => !element._isUnlocked),
                ...this.claimedAudioPool.filter((element) => !element._isUnlocked),
                /* eslint-enable no-underscore-dangle */
            ];
            unlockAudioAttempts = await Promise.all(
                lockedElements.map(AudioElementPool.unlockAudioElement),
            );
        } catch (error) {
            console.error('Unable to unlock HTML audio: ', error);
        }
        if (unlockAudioAttempts.includes(false)) {
            throw Error('Unable to unlock HTML audio, The operation is not allowed by the user agent.');
        }
    }

    /**
     * Take one of the unclaimed audio elements for use in the renderer
     *
     * @returns {HTMLAudioElement} Audio Element
     */
    claimAudioElement() {
        if (!this.audioPool.length) {
            return null;
        }
        const element = this.audioPool.pop();
        this.claimedAudioPool.push(element);
        _.pull(this.audioPool, element);
        return element;
    }

    /**
     * Return an audio element back to the pool now that we're done with it
     *
     * @param {HTMLAudioElement} element The audio element to release from use
     */
    releaseAudioElement(element) {
        _.pull(this.claimedAudioPool, element);
        this.audioPool.push(element);
        // TODO: Clean event listeners on re-addition?
    }
}

// AudioPool Singleton
export const globalAudioPool = new AudioElementPool();

let isAudioContextUnlocked = false;
let unlockingAudioContext = null;
// TODO: pass event? an check to confirm
export const unlockAudioContext = async () => {
    const ctx = getAudioContext();

    // We only want one instance of the unlocking active at a time
    if (unlockingAudioContext) {
        return unlockingAudioContext;
    }

    // If it's been unlocked and is running, we don't need to unlock it
    if (isAudioContextUnlocked && ctx.state === 'running') {
        // eslint-disable-next-line consistent-return
        return;
    }

    // if we've detected the audio context being suspnded or closed (the ctx.state call), reset the tracker
    isAudioContextUnlocked = false;

    // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
    if (typeof ctx.resume === 'function') {
        try {
            await ctx.resume();
        } catch (error) {
            console.error('unlockAudio was unable to resume audio context', error);
        }
    }

    unlockingAudioContext = new Promise(async (resolve) => {
        // Create an empty buffer.
        const source = ctx.createBufferSource();

        // Setup a timeout to check that we are unlocked on the next event loop.
        source.onended = () => {
            source.disconnect(0);
            // Update the unlocked state and prevent this check from happening again.
            isAudioContextUnlocked = true;
            resolve();
        };

        // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
        // http://stackoverflow.com/questions/24119684
        // .045 msec of silence
        source.buffer = ctx.createBuffer(1, 1, 22050);
        // connect to output (your speakers)
        source.connect(ctx.destination);

        // Play the empty buffer.
        if (typeof source.start === 'undefined') {
            source.noteOn(0);
        } else {
            source.start();
        }
    });

    // Reset the global promise to null
    unlockingAudioContext.finally(() => {
        unlockingAudioContext = null;
    });

    return unlockingAudioContext;
};

let isAudioPoolUnlocked = false;
// We only want one unlocking audio attempt happening at a time
let unlockingAudioPool = null;

/**
 * Unlocks audio elements in the audio pool for safari and mobile browsers
 * Should be run as soon as possible to capture mobile events
 *
 * Based on: https://paulbakaus.com/tutorials/html5/web-audio-on-ios/
 *       and https://github.com/goldfire/howler.js/blob/master/src/howler.core.js
 *
 * @returns {Promise} Promise that resolves when the audio pool is unlocked
 */
export const unlockAudioPool = async () => {
    // If it's been unlocked, we don't need to do it again
    if (isAudioPoolUnlocked) {
        return;
    }

    // We only want one instance of the unlocking active at a time
    if (unlockingAudioPool) {
        // eslint-disable-next-line consistent-return
        return unlockingAudioPool;
    }

    unlockingAudioPool = globalAudioPool.unlockAllAudio();

    // Reset the global promise to null
    unlockingAudioPool.finally(() => {
        unlockingAudioPool = null;
        isAudioPoolUnlocked = true;
    });

    // eslint-disable-next-line consistent-return
    return unlockingAudioPool;
};