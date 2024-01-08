// Vendor
import _ from 'lodash';
import PropTypes from 'prop-types';

// Editor
import VideoCropper from 'editor/components/VideoCropper.js';
import VideoFocalPointSelector from 'editor/components/VideoFocalPointSelector.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    fitFillModes,
    modificationConfigurationPaths
} from 'editor/constants/EditorVideo.js';

/**
 * Renders either a crop or focal point overlay over the video preview depending on the selected fit mode
 */
export default function EditorVideoFitFillOverlayControls({
    currentConfigurationValue,
    currentlyEditingVideoField,
}) {
    const {
        useUpdateVideoModification
    } = currentlyEditingVideoField;
    const updateVideoModification = useUpdateVideoModification();

    const videoFitModificationValue = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.fit,
    );

    return videoFitModificationValue === fitFillModes.fitVideo ? ( <
        VideoCropper currentConfigurationValue = {
            currentConfigurationValue
        }
        updateVideoModification = {
            updateVideoModification
        }
        />
    ) : ( <
        VideoFocalPointSelector currentConfigurationValue = {
            currentConfigurationValue
        }
        updateVideoModification = {
            updateVideoModification
        }
        />
    );
}
EditorVideoFitFillOverlayControls.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
};