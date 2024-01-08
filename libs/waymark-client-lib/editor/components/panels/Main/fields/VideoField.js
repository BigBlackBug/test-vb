// Vendor
import _ from 'lodash';
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import HoverVideoPlayer from 'react-hover-video-player';

// Editor
import {
    editorPanelKeys
} from 'editor/constants/Editor';
import {
    useEditorPanelDispatch
} from 'editor/providers/EditorPanelProvider';
import editorPropTypes from 'editor/constants/editorPropTypes.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    formatSecondsAsTimestamp
} from 'shared/utils/text.js';
import {
    useRendererFramerate
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import ProgressiveImage from 'shared/components/ProgressiveImage';

import * as styles from './VideoField.css';

/**
 * An editor field which allows the user to edit a video.
 *
 * @param {object}  videoFieldConfig    Form description for video field.
 * @param {func}    onFieldFocus        Jumps the video to the video field's display time.
 */
export default function VideoField({
    videoFieldConfig,
    onFieldFocus
}) {
    // Destructuring hook before using so that we can take advantage of eslint rules of hooks
    const {
        useCurrentVideoAssetProcessedOutput,
        useCurrentVideoAssetURL,
        useCurrentVideoAssetMetadata,
    } = videoFieldConfig;

    const videoSrc = useCurrentVideoAssetURL();
    const [thumbnailImages] = useCurrentVideoAssetProcessedOutput(['tenThumbnails_jpg300']);

    const videoFramerate = useRendererFramerate();
    const videoFieldPlaybackDuration =
        (videoFieldConfig.outPoint - videoFieldConfig.inPoint) / videoFramerate;
    const {
        openControlPanel
    } = useEditorPanelDispatch();

    const onClickVideoField = useCallback(() => {
        // Jump video to the time when this field is visible
        onFieldFocus();

        // Opens video editing panel.
        openControlPanel(editorPanelKeys.video, {
            selectedVideoFieldKey: videoFieldConfig.editingFieldKey,
        });
    }, [openControlPanel, videoFieldConfig, onFieldFocus]);

    // Get the asset's metadata so we can determine its aspect ratio
    // NOTE: This is sort of hacky (as noted in the hook's code comments).
    // The VPS isn't totally done until { width, height, length} are available.
    // But we will potentially have { loadingThumbnail, loadingThumbnailWidth, loadingThumbnailHeight }.
    const videoAssetMetadata = useCurrentVideoAssetMetadata();
    let videoAssetAspectRatio = videoAssetMetadata ?
        videoAssetMetadata.width / videoAssetMetadata.height :
        null;
    // Temporarily hide the bottom 4% of the container to make sure we don't show timecodes in
    // clips that were exported from the Studio. That means the default value should be 100 and we
    // can remove (- 4) from the first part of the calculation.
    const height = videoAssetAspectRatio >= 1 ? 100 / videoAssetAspectRatio - 4 : 96;
    // Calculate the number of film strip segments we should show for the thumbnail.
    // Maximum amount of segments we want is 6, and the maximum height is 96% to account for
    // timecodes. That *would* give us a divisor of 16 but we're using 12 to account for top
    // and bottom margin (4px total).
    // NOTE: This should still work, but once we are done hiding the bottom 4% of the container
    // to acccount for timecodes we should double check.
    const numFilmStripSegments = Math.min(Math.floor(height / 12), 6);

    return ( <
        div className = {
            styles.FieldContainer
        } >
        <
        WaymarkButton
        // VIDEO UPLOAD TODO: Is this action setup?
        analyticsAction = "selected_video_field"
        onClick = {
            onClickVideoField
        }
        onFocus = {
            onFieldFocus
        }
        hasFill = {
            false
        }
        className = {
            styles.FieldSelectorButton
        } >
        <
        div className = {
            styles.SquareAspectRatioWrapper
        } > {
            /* Don't display the thumbnail until we have the video asset's metadata loaded and know its aspect ratio
                          so that we can display it correctly */
        } {
            Boolean(videoAssetAspectRatio) ? ( <
                div className = {
                    styles.VideoWrapper
                } >
                <
                div className = {
                    styles.VideoAspectRatioWrapper
                }
                style = {
                    {
                        // Set width and height of the wrapper to match the asset's aspect ratio
                        // If the aspect ratio is > 1 and is therefore wider than it is tall, set width to 100% and height to appropriate percentage to match the aspect ratio
                        // If the aspect ratio is < 1 as is therefore tall, set height to 100% and width to appropriate percentage to match aspect ratio
                        width: videoAssetAspectRatio >= 1 ? '100%' : `${100 * videoAssetAspectRatio}%`,
                        height: `${height}%`,
                    }
                } >
                {
                    videoSrc ? ( <
                        HoverVideoPlayer videoSrc = {
                            videoSrc
                        }
                        pausedOverlay = { <
                            >
                            <
                            ProgressiveImage
                            // Arbitrarily use the 2nd thumbnail pulled from the video for our thumbnails
                            // We could really have this be anything we want, but we just need to make sure we don't use the first thumbnail
                            // because videos can sometimes have a blank first frame
                            src = {
                                thumbnailImages[1]
                            }
                            alt = {
                                videoFieldConfig.label
                            }
                            shouldCoverContainer /
                            >
                            <
                            div className = {
                                styles.FilmStripBorder
                            } > {
                                _.range(numFilmStripSegments).map((numFilmStrip) => ( <
                                    div key = {
                                        numFilmStrip
                                    }
                                    className = {
                                        styles.FilmStripBorderSegment
                                    }
                                    />
                                ))
                            } <
                            /div> {
                                videoFieldPlaybackDuration && ( <
                                    div className = {
                                        styles.DurationLabel
                                    } > {
                                        formatSecondsAsTimestamp(videoFieldPlaybackDuration)
                                    } <
                                    /div>
                                )
                            } <
                            />
                        }
                        className = {
                            styles.FieldVideoPlayer
                        }
                        unloadVideoOnPaused crossOrigin = "anonymous" /
                        >
                    ) : null
                } <
                /div> <
                /div>
            ) : null
        } <
        /div> <
        /WaymarkButton> <
        /div>
    );
}

VideoField.propTypes = {
    videoFieldConfig: editorPropTypes.editorVideoField.isRequired,
    onFieldFocus: PropTypes.func.isRequired,
};