// Vendor
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import CollapseSwitchTransition from 'app/components/CollapseSwitchTransition.js';
/* END WAYMARK APP DEPENDENCIES */

import {
    useTypography
} from 'styles/hooks/typography.js';
import {
    themeVars
} from '@libs/shared-ui-styles';

/**
 * Displays a warning message about the current trim selection if it is longer or shorter than the
 * video field's base duration, along with a button to reset the duration
 *
 * @param {number} trimDuration                 The duration of the current trim selection
 * @param {number} videoAssetDuration           The duration of the video asset
 * @param {number} videoFieldPlaybackDuration   The base playback duration of the video field which we will use
 *                                                to determine if we need to show a clip duration warning
 * @param {func}   onClickResetClipDuration     Function resets the current clip duration
 * @param {bool}   hasTrimDurationWarning       Whether we should display a trim duration warning
 */
export default function EditorVideoTrimDurationWarning({
    trimDuration,
    videoAssetDuration,
    videoFieldPlaybackDuration,
    onClickResetClipDuration,
    hasTrimDurationWarning,
}) {
    // Set up the transition key we will use to transition the "reset clip" section between being hidden,
    // showing a message for a short clip, and showing a message for a long clip
    let clipDurationWarningTransitionKey = 'hidden';
    // Determine what warning message we should show about the clip duration
    let clipDurationWarningMessage = null;

    if (hasTrimDurationWarning) {
        clipDurationWarningTransitionKey = trimDuration < videoFieldPlaybackDuration ? 'short' : 'long';

        if (trimDuration < videoFieldPlaybackDuration) {
            // If the trim selection is shorter than the field's base duration, show a message indicating that it will be cut off
            clipDurationWarningMessage = ( <
                >
                Your selection is {
                    ' '
                } <
                b > less than {
                    Math.round(videoFieldPlaybackDuration * 10) / 10
                }
                seconds. < /b> We&apos;ll
                hold the last frame of your clip to fill the space in the template. <
                />
            );
        } else {
            // If the trim selection is longer than the field's base duration, show a message indicating that it will be sped up
            clipDurationWarningMessage = ( <
                >
                Your selection is {
                    ' '
                } <
                b > longer than {
                    Math.round(videoFieldPlaybackDuration * 10) / 10
                }
                seconds. < /b> We&apos;ve
                tweaked its speed to fit. <
                />
            );
        }
    }

    const [bodyTextStyle] = useTypography(['body']);

    return ( <
        CollapseSwitchTransition transitionKey = {
            clipDurationWarningTransitionKey
        } > {
            clipDurationWarningMessage ? ( <
                div className = {
                    css `
            margin-top: 8px;
            padding: 12px 24px;
            border-radius: 4px;
            background-color: ${themeVars.color.negative.default};
          `
                } >
                <
                p className = {
                    css `
              ${bodyTextStyle}
              color: ${themeVars.color.white};
              margin: 0;
            `
                }
                data - testid = "clipDurationWarningMessage" >
                {
                    clipDurationWarningMessage
                } {
                    ' '
                } {
                    videoAssetDuration >= videoFieldPlaybackDuration ? (
                        // Only show a reset button if the video asset is at least as long as the base video field playback duration
                        // Button resets the trim selection to the base duration
                        <
                        WaymarkButton onClick = {
                            onClickResetClipDuration
                        }
                        colorTheme = "BlackText"
                        typography = "bodyMedium"
                        className = {
                            css `
                  display: inline;
                  text-decoration: underline;
                `
                        }
                        hasFill = {
                            false
                        }
                        isUppercase = {
                            false
                        } >
                        Reset clip length. <
                        /WaymarkButton>
                    ) : null
                } <
                /p> <
                /div>
            ) : null
        } <
        /CollapseSwitchTransition>
    );
}
EditorVideoTrimDurationWarning.propTypes = {
    trimDuration: PropTypes.number.isRequired,
    videoAssetDuration: PropTypes.number.isRequired,
    videoFieldPlaybackDuration: PropTypes.number.isRequired,
    onClickResetClipDuration: PropTypes.func.isRequired,
    hasTrimDurationWarning: PropTypes.bool.isRequired,
};