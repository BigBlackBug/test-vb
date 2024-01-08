// Vendor
import _ from 'lodash';
import {
    useEffect,
    useState
} from 'react';

// Local
import breakpoints from 'styles/constants/breakpoints.js';

import {
    videoSectionPadding
} from 'editor/components/Editor.css';

const DOUBLE_VIDEO_SECTION_PADDING_AMOUNT = parseInt(videoSectionPadding, 10) * 2;
const MAX_PLAYER_WIDTH = breakpoints.medium.maxWidth;
const MOBILE_SCREEN_WIDTH = breakpoints.small.maxWidth;

/**
 * Hook calculates the dimensions that a video player should be displayed at and dynamically updates
 * this size as the window is resized
 *
 * @param {number | null}  aspectRatio      The aspect ratio (calcualted as width / height) of the variant and therefore the aspect ratio
 *                                            we will need to preserve for the player
 * @param {object}  videoPlayerSectionRef   Ref to the containing section that the video player should be sized relative to
 */
export const useVideoPlayerDimensions = (aspectRatio, videoPlayerSectionRef) => {
    // Keeps track of the width and height that the video player should be displayed at
    const [playerDimensions, setPlayerDimensions] = useState(() => ({
        width: 0,
        height: 0
    }));

    useEffect(() => {
        // Return early if we don't have an aspect ratio yet
        if (!aspectRatio) {
            return undefined;
        }

        // Update the video player size when the window is resized
        // Throttle this event for performance purposes
        const onWindowResize = _.throttle(() => {
            const isMobile = window.innerWidth <= MOBILE_SCREEN_WIDTH;
            // Get the maximum possible dimensions that the video player could stretch to - 80% of the video player section's width and height
            const playerMaxWidth =
                Math.min(
                    videoPlayerSectionRef.current.clientWidth * (isMobile ? 1 : 0.85),
                    // Cap the player's width at 991px
                    MAX_PLAYER_WIDTH,
                ) - DOUBLE_VIDEO_SECTION_PADDING_AMOUNT; // Factor in 32px padding to the left and right of the player
            const playerMaxHeight = Math.min(
                (isMobile ? window.innerHeight : videoPlayerSectionRef.current.clientHeight) * 0.85 -
                DOUBLE_VIDEO_SECTION_PADDING_AMOUNT, // Factor in 32px padding above/below the player
                // Cap the player's height at 991px
                MAX_PLAYER_WIDTH,
            );

            // Calculate the possible dimensions that the player could be displayed at based on its aspect ratio
            const maxAspectRatioDisplayHeight = playerMaxWidth / aspectRatio;
            const maxAspectRatioDisplayWidth = playerMaxHeight * aspectRatio;

            // If the video would be too tall when using the max possible player width, let's fit to the max height instead
            if (maxAspectRatioDisplayHeight >= playerMaxHeight) {
                setPlayerDimensions({
                    width: maxAspectRatioDisplayWidth,
                    height: playerMaxHeight,
                });
            }
            // Otherwise, if the video would be too width when using the max possible player height, let's fit to the max width
            else if (maxAspectRatioDisplayWidth >= playerMaxWidth) {
                setPlayerDimensions({
                    width: playerMaxWidth,
                    height: maxAspectRatioDisplayHeight,
                });
            }
        }, 200);

        // Set up our initial dimensions
        onWindowResize();

        window.addEventListener('resize', onWindowResize);

        return () => window.removeEventListener('resize', onWindowResize);
    }, [aspectRatio, videoPlayerSectionRef]);

    return playerDimensions;
};