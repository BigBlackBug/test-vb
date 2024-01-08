/**
 * Convert a linear volume value to a logarithmic gain value.
 * volume=0.5 -> Audio is at 50% volume
 * volume=1.0 -> Audio is at 100% volume
 * volume=2.0 -> Audio is at 200% volume
 * etc.
 *
 * This assumes gain is represented using the following formula,
 * where Pout is the power from the output and Pin is the power applied to the input:
 *
 *   gain = 10log10(Pout / Pin)
 *
 * So this conversion is the inverse of the above formula, where (Pout / Pin) is the "volume level."
 *
 * More info about gain: https://en.wikipedia.org/wiki/Gain_%28electronics%29
 *
 * @param  {float} volume Volume level
 * @return {float}        Gain
 */
export const volumeToGain = (volume) => 10 ** volume / 10;

/**
 * Convert a logarithmic gain value to a linear volume value.
 * This is the inverse of volumeToGain.
 *
 * @param  {float} gain Gain
 * @return {float}      Volume level
 */
export const gainToVolume = (gain) => Math.log10(gain * 10);

// Fallback for safari, which doens't have a fully working AudioContext object
let SafeAudioContext = null;
if (typeof AudioContext !== 'undefined') {
    // Default
    SafeAudioContext = AudioContext;
} else if (typeof webkitAudioContext !== 'undefined') {
    // Safari and old versions of Chrome
    // eslint-disable-next-line no-undef
    SafeAudioContext = webkitAudioContext;
}

/**
 * Gets a global audio context that we will use throughout the the Renderer lib
 *
 * @return     {AudioContext}  The audio context.
 */
let globalAudioContext = null;
export const getAudioContext = () => {
    if (!SafeAudioContext) {
        // Web Audio API is not supported
        // Alert the user too?
        console.error(
            'Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox',
        );
    } else if (!globalAudioContext) {
        // Do whatever you want using the Web Audio API
        globalAudioContext = new SafeAudioContext();
        return globalAudioContext;
    }
    return globalAudioContext;
};