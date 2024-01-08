import {
    forwardRef,
    useEffect
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

/**
 * Renders a video player to preview the video asset being edited in the video control panel's edit tab
 *
 * @param {Object}  videoAssetMetadata  Object representing the video asset's metadata
 * @param {string}  videoSrc    Source URL for the video asset to preview
 * @param {string}  posterSrc   Source URL for a poster image to display on the video player before the user starts playing it
 * @param {Node}    [overlay]   Overlay contents to display on top of the video
 *
 * All other props are passed through to the video element.
 */
const EditorVideoPreview = forwardRef(
    ({
        videoAssetMetadata,
        videoSrc,
        posterSrc,
        overlay,
        currentConfigurationValue
    }, ref) => {
        const videoAssetAspectRatio = videoAssetMetadata.width / videoAssetMetadata.height;

        // Get the current clip volume from the configuration so we can set the video element's volume to match
        const isClipMuted = currentConfigurationValue.isMuted || false;
        const clipVolume = isClipMuted ? 0 : currentConfigurationValue.volume || 1;

        useEffect(() => {
            // Effect makes our video preview audio match when the volume is lowered
            // Note that we are not currently reflecting when the volume gets amplified above 100%;
            // this is more complicated and involves messing around with creating and connecting an audio context and gain node
            // to the video element, so we're going to skip it but can experiment further later on if it feels valuable
            const videoElement = ref.current;
            videoElement.volume = Math.min(clipVolume, 1);
        }, [clipVolume, ref]);

        return ( <
            div className = {
                css `
          position: relative;
          height: 0;
          margin: 12px auto;
          border-radius: 2px;
        `
            }
            style = {
                {
                    // If the video's aspect ratio is wider than it is tall, have it fill the width of the panel
                    // otherwise if it's vertical, limit the video's width so that it doesn't get too big
                    width: videoAssetAspectRatio >= 1 ? '100%' : `${100 * videoAssetAspectRatio}%`,
                    // Temporarily hide the bottom 3% of the video to accommodate timecodes in studio exported clips.
                    paddingBottom: videoAssetAspectRatio <= 1 ? '97%' : `${97 / videoAssetAspectRatio}%`,
                }
            } >
            { /* eslint-disable-next-line jsx-a11y/media-has-caption */ } <
            video className = {
                css `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center top;
            user-select: none;
          `
            }
            ref = {
                ref
            }
            playsInline loop poster = {
                posterSrc
            }
            // Use a key to force the video element to unmount/remount so that when the video's source changes, it
            // will re-load with the new source
            key = {
                videoSrc
            }
            crossOrigin = "anonymous"
            preload = "auto" >
            {
                videoSrc && < source src = {
                    videoSrc
                }
                type = "video/mp4" / >
            } <
            /video> {
                overlay
            } <
            /div>
        );
    },
);
EditorVideoPreview.propTypes = {
    videoAssetMetadata: PropTypes.shape({
        length: PropTypes.number,
        width: PropTypes.number,
        height: PropTypes.number,
    }).isRequired,
    videoSrc: PropTypes.string,
    posterSrc: PropTypes.string,
    overlay: PropTypes.node,
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
};
EditorVideoPreview.defaultProps = {
    videoSrc: null,
    posterSrc: null,
    overlay: null,
};

export default EditorVideoPreview;