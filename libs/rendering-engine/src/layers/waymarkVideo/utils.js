import {
    extractPixels
} from '../utils/index.js';

/**
 * Gets the frame number of a video from canvas that has frame data encoded on it.
 * Frames should be encoded in binary data in the first 12 frames in the first row.
 * The binary data is right-to-left, Black pixels are 0s, White Pixels are 1
 *
 * i.e.
 * BBBBWBBBWWBW => 000010001101 => 141
 *
 * This function is borrowed from
 * stikdev/ivory:web/client/shared/web_video/configurator/FrameAwareVideo.js
 * and adjusted since we are now rendering ONLY the timecode binary data, rather than
 * the entire video frame.
 *
 * @param      {Canvas}      canvas  The canvas to measure
 * @param      {object}      frameSyncStats     The stats about the timecode embedded in the video
 * @param      {number}      frameSyncStats.timecodeDigitCount     The number of digits used to represent the timecode
 * @param      {number}      frameSyncStats.timecodeDigitHeight    The height of each digit
 * @param      {number}      frameSyncStats.timecodeDigitWidth     The width of each digit
 * @param      {string}      frameSyncStats.timecodePlacement      The placement of the timecode
 *
 * @return     {Number}      The frame number of the video
 */
export function getFrameNumberFromSprite(renderer, sprite, timecodeSettings) {
    const {
        timecodeDigitCount,
        timecodeDigitHeight,
        timecodeDigitWidth
    } = timecodeSettings;

    // Ensure these numbers are 0-based by subtracting 1!
    const rowToRead = Math.ceil(timecodeDigitHeight / 2) - 1;
    const columnToRead = Math.ceil(timecodeDigitWidth / 2) - 1;

    const width = Math.round(timecodeDigitCount * timecodeDigitWidth);
    const imageData = renderer.plugins.extract.pixels(sprite, {
        x: 0,
        y: rowToRead,
        width,
        height: 1,
    });

    if (!imageData || !imageData.length) {
        return null;
    }

    let binaryString = '';

    for (let i = columnToRead; i < imageData.length; i += timecodeDigitWidth * 4) {
        let digit;

        // All RGBA < 150? It's a "0"
        if (imageData[i] + imageData[i + 1] + imageData[i + 2] < 150 * 3) {
            digit = '0';
        } else {
            digit = '1';
        }

        binaryString += digit;
    }

    const frameNumber = parseInt(binaryString, 2);

    return frameNumber;
}

/**
 * Convert a frame number to a video element timestamp.
 * It is not sufficient to simply divide the frame number by the framerate to create a video element
 * timestamp for two reasons:
 *   1. Video elements ignore everything beyond the sixth decimal digit, and
 *   2. A perfectly rounded timestamp, i.e. "0.3" for frame 9 at 30fps, consistently displays the
 *      frame that ends at that time, not the frame that begins at that time.
 *
 * Note that second "1" (frame 30 at 30fps, frame 60 at 60fps) is a special case that returns
 * 1.000002 instead of 1.000001. This is because Chrome rounds 1.000001 down to 1.
 * Chrome does not round other nearly-whole values, such as 2.000001 or 10.000001.
 *
 * Example conversions for a 30fps video:
 *
 * Frame number   Frame number / 30fps      Output timestamp
 *   0             0                         0
 *   1             0.03333333333333333       0.033334
 *   2             0.06666666666666666       0.066667
 *   3             0.1                       0.100001
 *  30             1                         1.000002
 *  60             2                         2.000001
 * 300            10                        10.000001
 *
 * @param  {Number} frameNumber Frame number
 * @param  {Number} framerate   Framerate
 * @return {Number}             Video element timestamp
 */
export function frameNumberToVideoElementTime(frameNumber, framerate) {
    if (frameNumber === 0) {
        return 0;
    }

    // Chrome rounds 1.000001 down to 1, which results in the frame that ends at 1 being displayed
    // instead of the frame that begins at 1. 1.000002 is not rounded down.
    //
    // Other values such as 2.000001, 10.000001, 30.000001, etc are not impacted.
    if (frameNumber / framerate === 1) {
        return 1.000002;
    }

    const seekTime = frameNumber / framerate;
    const adjustedSeekTime = (Math.floor(seekTime * 1000000) + 1) / 1000000;
    return adjustedSeekTime;
}

/**
 * Seek a videoMediaHandler video to a target frame number.
 *
 * @param      {VideoMediaHandler}   videoMediaHandler   The video media handler
 * @param      {PIXI.Renderer}       renderer            The Pixi renderer used for this application
 * @param      {PIXI.Sprite}         timecodeSprite      The Sprite of the Timecode used by the videp
 * @param      {number}              targetFrameNumber   The target frame number we're trying to seek to
 * @param      {number}              framerate           The framerate (the amount of time in seconds each frame is)
 * @param      {object}              timecodeSettings    The stats about the timecode embedded in the video
 * @param      {number}              timecodeSettings.timecodeDigitCount     The number of digits used to represent the timecode
 * @param      {number}              timecodeSettings.timecodeDigitHeight    The height of each digit
 * @param      {number}              timecodeSettings.timecodeDigitWidth     The width of each digit
 * @param      {string}              timecodeSettings.timecodePlacement      The placement of the timecode
 * @return     {Promise}
 */
export async function seekVideoToFrame(
    videoMediaHandler,
    renderer,
    timecodeSprite,
    targetFrameNumber,
    framerate,
    timecodeSettings,
) {
    let seekTime = frameNumberToVideoElementTime(targetFrameNumber, framerate);
    let isVideoOnFrame = false;
    // Only attempt to seek 5 times before bailing, to avoid infinite loops
    let seekFrameTimeoutCounter = 30;
    while (!isVideoOnFrame) {
        /* eslint-disable-next-line no-await-in-loop */
        await videoMediaHandler.seekToTime(seekTime);
        timecodeSprite.texture.baseTexture.update();

        const currentFrameNumber = getFrameNumberFromSprite(renderer, timecodeSprite, timecodeSettings);

        // If we can't read from the canvas, stop attempting to seek
        if (currentFrameNumber === null) {
            break;
        }

        isVideoOnFrame = currentFrameNumber === targetFrameNumber;

        // If we've attempted to seek 5 times and still haven't gotten it, throw an exception
        if (!isVideoOnFrame && seekFrameTimeoutCounter <= 0) {
            throw new Error(`Timed out seeking to frame ${targetFrameNumber}`);
        }

        // if the video is still not on the frame move forward or back in time until we're on the correct frame
        if (!isVideoOnFrame) {
            // Decrease our timeout counter
            seekFrameTimeoutCounter -= 1;

            if (currentFrameNumber < targetFrameNumber) {
                // advance the time by 1/4 of a frame
                seekTime += 1 / (framerate * 4);
                /* eslint-disable-next-line no-param-reassign */
            } else {
                // rewind the time by 1/4 of a frame
                seekTime -= 1 / (framerate * 4);
                /* eslint-disable-next-line no-param-reassign */
            }
        }
    }

    await new Promise(requestAnimationFrame);
}