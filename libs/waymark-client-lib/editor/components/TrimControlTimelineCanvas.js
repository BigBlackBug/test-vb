// Vendor
import {
    useEffect,
    useRef,
    useState
} from 'react';
import {
    WebVTT
} from 'videojs-vtt.js';

// Editor
import editorPropTypes from 'editor/constants/editorPropTypes.js';

/* WAYMARK APP DEPENDENCIES */
import useHttpResponse from 'app/hooks/httpResponse.js';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './TrimControlTimelineCanvas.css';

/**
 * Takes a raw .vtt file describing the positioning of each sprite image in the spritesheet
 * and formats it into an array of objects describing the sprite positions and dimensions that we
 * we can use to extract them from the spritesheet image and draw them on the canvas
 *
 * An example .vtt file looks like:
 *
 * WEBVTT
 *
 * 00:00:00.000 --> 00:00:02.000
 * 12415_asdf.jpg#xywh=0,0,200,112
 *
 * 00:00:02.000 --> 00:00:04.000
 * 12415_asdf.jpg#xywh=200,0,200,112
 *
 * ...
 */
const formatLoadedSpritesheetVTTFile = (rawFile) => {
    // Set up our parser to parse the WebVTT file
    const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

    // The WebVTT parser will parse our raw WebVTT file into "cues"
    // A "cue" in this case is a group of 2 lines where the first line represents start and end times
    // and the second line represents some text associated with that time segment. This file format is usually used
    // for video closed captions, hence the naming convention.
    const spriteCues = [];
    // Note that although this uses an event callback convention, this will be run synchronously when
    // parser.parse() is called so we don't have to do any async stuff to wait for the parser to finish
    // getting cues from the file
    parser.oncue = (cue) => spriteCues.push(cue);

    // Run the file text through the parser
    parser.parse(rawFile);
    // Indicate that the parser is done receiving inputs
    parser.flush();

    // Filter out any sprites which have the same start and end time, as this means it was the final captured thumbnail
    // that was unable to advance a full 2 seconds. We're dropping these because there's a higher likelihood of them
    // appearing as a blank black frame
    const filteredSpriteCues = spriteCues.filter(({
        startTime,
        endTime
    }) => startTime !== endTime);

    return filteredSpriteCues.map((spriteCue) => {
        // Extract the portion of the cue that describes the x and y positions and width and height of this image
        // in the spritesheet which we will use to draw on the canvas
        const imageXYWidthHeightString = spriteCue.text.split('#xywh=')[1];

        // Get the image dimensions parsed as usable integers
        const [x, y, width, height] = imageXYWidthHeightString
            .split(',')
            .map((imageDimensionString) => parseInt(imageDimensionString, 10));

        return {
            startTime: spriteCue.startTime,
            endTime: spriteCue.endTime,
            x,
            y,
            width,
            height,
        };
    });
};

/**
 * Renders a canvas which will load the video asset's sprite sheet files and draw them all together side by side for the
 * trim controls timeline
 *
 * @param {EditorVideoField} currentlyEditingVideoField   The video field currently selected for editing which we will get the
 *                                                          parsed spritesheet for so we can draw it to the canvas
 */
export default function TrimControlTimelineCanvas({
    currentlyEditingVideoField
}) {
    const canvasRef = useRef();

    const [loadedSpritesheetImage, setLoadedSpritesheetImage] = useState(null);

    // Get the processed spritesheet for the video asset
    const {
        useCurrentVideoAssetProcessedOutput
    } = currentlyEditingVideoField;
    const [
        [spritesheetImageURL, spritesheetPositionDescriptionVTTFileURL]
    ] =
    useCurrentVideoAssetProcessedOutput(['everyTwoSpritesheet_jpg200']);

    // Load the spritesheet VTT file and format it as an array of objects
    // describing the sprites' positions/dimensions which we can use to extract them from
    // the spritesheet image and draw them to our canvas
    const spritesheetSpritePositions = useHttpResponse(
        // If this hook receives a falsey value it will just do nothing
        spritesheetPositionDescriptionVTTFileURL,
        formatLoadedSpritesheetVTTFile,
    );

    useEffect(() => {
        if (!spritesheetImageURL) return;

        // Start loading the spritesheet image
        const spritesheetImage = new Image();
        spritesheetImage.src = spritesheetImageURL;

        spritesheetImage.onload = () => {
            // Once the spritesheet is loaded and usable, store that so we can draw it onto the canvas
            setLoadedSpritesheetImage(spritesheetImage);
        };
    }, [spritesheetImageURL]);

    useEffect(() => {
        // Return early if our image and/or VTT file aren't loaded
        if (!loadedSpritesheetImage || !spritesheetSpritePositions) return;

        const canvas = canvasRef.current;

        const {
            width: canvasWidth,
            height: canvasHeight
        } = canvas.getBoundingClientRect();

        // Set the pixel dimensions of the canvas that we'll draw to to match the dimensions that the canvas
        // is being displayed at in the browser
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext('2d');

        const spriteCount = spritesheetSpritePositions.length;

        // Rounding up to the nearest integer to avoid any odd half-pixel gaps on the canvas
        const spriteDisplayWidth = Math.ceil(canvasWidth / spriteCount);

        spritesheetSpritePositions.forEach(({
            x,
            y,
            width,
            height
        }, index) => {
            const spriteImageAspectRatio = width / height;

            // Determine the aspect ratio of the cropped segment of the image that we will display
            const spriteDisplayAspectRatio = spriteDisplayWidth / canvasHeight;

            // Determine the width and height of the portion of the sprite that we want to
            // extract to be drawn on the canvas
            let spriteExtractionWidth;
            let spriteExtractionHeight;

            if (spriteImageAspectRatio >= spriteDisplayAspectRatio) {
                // If the sprite is wider than the segment we'll display it in, we'll use its full height and crop in the sides
                spriteExtractionHeight = height;
                spriteExtractionWidth = spriteDisplayAspectRatio * spriteExtractionHeight;
            } else {
                // If the sprite is taller than the display segment, we'll use its full width and crop in the top and bottom
                spriteExtractionWidth = width;
                spriteExtractionHeight = spriteExtractionWidth / spriteDisplayAspectRatio;
            }

            ctx.drawImage(
                loadedSpritesheetImage,
                // Ensure that the segment of the sprite image we're extracting is centered
                Math.floor(x + (width - spriteExtractionWidth) / 2),
                Math.floor(y + (height - spriteExtractionHeight) / 2),
                spriteExtractionWidth,
                spriteExtractionHeight,
                spriteDisplayWidth * index,
                0,
                spriteDisplayWidth,
                canvasHeight,
            );
        });
    }, [loadedSpritesheetImage, spritesheetSpritePositions]);

    return <canvas ref = {
        canvasRef
    }
    className = {
        styles.TimelineCanvas
    }
    />;
}
TrimControlTimelineCanvas.propTypes = {
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
};