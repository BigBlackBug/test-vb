// Vendor
import {
    css
} from '@emotion/css';
import _ from 'lodash';
import PropTypes from 'prop-types';

// Editor
import {
    EditorControlSectionHeading
} from 'editor/components/EditorControlHeadings';
import EditorVolumeSlider from 'editor/components/EditorVolumeSlider';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    modificationConfigurationPaths
} from 'editor/constants/EditorVideo.js';
import {
    useAudioControlsContext
} from 'editor/providers/EditorAudioControlsProvider.js';

// Shared
import {
    usePauseVideoPlayback
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

/**
 * Renders controls for adjusting the current video field's audio
 *
 * @param {EditorVideoField} currentlyEditingVideoField   The video field currently selected for editing which we will perform adjustments on
 */
export default function EditorVideoAudioAdjustControls({
    currentlyEditingVideoField,
    currentConfigurationValue,
    updateVideoConfigurationValue,
}) {
    const {
        getCurrentDuckingTargetGUID
    } = currentlyEditingVideoField;
    const currentDuckingTargetGUID = getCurrentDuckingTargetGUID();

    const {
        getVolumeChangeForTarget,
        setVolumeChangeForTarget
    } = useAudioControlsContext();
    const currentVolumeChange = getVolumeChangeForTarget(currentDuckingTargetGUID);

    // Clip volume sets the volume of the video field's video clip
    const clipVolume =
        _.get(currentConfigurationValue, modificationConfigurationPaths.volume, 1) * 100;

    // Background volume represents the volume of any background audio
    // that may be playing - either video template audio or uploaded
    // by the user
    const backgroundVolume = _.get(currentVolumeChange, 'targetVolume', 1) * 100;

    // Adjust the clip volume for its duration
    const updateClipVolume = (newVolume) =>
        updateVideoConfigurationValue(
            (configurationValue) => ({
                ...configurationValue,
                // Update `isMuted` value depending on if the new volume is 0 or not
                [modificationConfigurationPaths.isMuted]: newVolume === 0,
                // If we are muting the clip volume, don't update volume via the Editing API
                // so we have access to the previous volume if they un-mute the audio.
                [modificationConfigurationPaths.volume]: newVolume === 0 ? configurationValue.volume : newVolume / 100,
            }),
            modificationConfigurationPaths.all,
        );

    const pauseVideoPlayback = usePauseVideoPlayback();
    const updateVolume = async (volume) => {
        await pauseVideoPlayback();

        setVolumeChangeForTarget(currentDuckingTargetGUID, volume / 100);
    };

    return ( <
        >
        <
        EditorControlSectionHeading heading = "Audio"
        className = {
            css `
          margin: 32px 0 16px;
        `
        }
        /> <
        EditorVolumeSlider sliderLabel = "Clip Volume"
        currentVolume = {
            currentConfigurationValue.isMuted ? 0 : clipVolume
        }
        updateVolume = {
            updateClipVolume
        }
        className = {
            css `
          margin-bottom: 20px;
        `
        }
        /> <
        EditorVolumeSlider sliderLabel = "Music Volume"
        currentVolume = {
            backgroundVolume
        }
        updateVolume = {
            updateVolume
        }
        tooltip = { <
            >
            Adjust the background music < strong >
            while this clip is playing. < /strong> <
            />
        }
        className = {
            css `
          margin-bottom: 32px;
        `
        }
        /> <
        />
    );
}
EditorVideoAudioAdjustControls.propTypes = {
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoConfigurationValue: PropTypes.func.isRequired,
};