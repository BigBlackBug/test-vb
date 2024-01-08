/**
 * Determine if a mimetype can be played.
 * Returns the result of videoElement.canPlayType, which is a string, not a boolean.
 *
 * @param  {string} mimetype     Mimetype
 * @param  {object} videoElement The VideoElement to use for calling canPlayType. Especially helpful parameter for testing.
 * @return {string}              Can play mimetype result
 */
export const canPlayMimetype = (mimetype, videoElement = document.createElement('video')) =>
    videoElement.canPlayType(mimetype);

/**
 * Given an array of mimetypes will try to return the "best" mimetype for the current browser.
 * The sorting criteria is: MediaElement.canPlayType of 'probably', MediaElement.canPlayType of 'maybe',
 * order in the original array.
 *
 * If none of the mimetypes are a MediaElement.canPlayType result of 'probably' or 'maybe' an exception
 * will be thrown.
 * @param  {array} mimetypes
 * An array of mimetype strings. e.g. ['video/mp4; codecs="avc1.640020, mp4a.6B"', 'video/webm']
 * @param {VideoElement} [videoElement=document.createElement('video')]
 * The VideoElement to use for calling canPlayType. Especially helpful parameter for testing.
 * @return {string}
 * The best mimetype to use.
 * */
export const determineBestMimetype = (
    mimetypes,
    videoElement = document.createElement('video'),
) => {
    const bestProbablyMimetype = mimetypes.find(
        (mimetype) => canPlayMimetype(mimetype, videoElement) === 'probably',
    );
    if (bestProbablyMimetype) {
        return bestProbablyMimetype;
    }

    const bestMaybeMimetype = mimetypes.find(
        (mimetype) => canPlayMimetype(mimetype, videoElement) === 'maybe',
    );
    if (bestMaybeMimetype) {
        return bestMaybeMimetype;
    }

    throw Error('Cannot find video source that has a type playable by this browser');
};