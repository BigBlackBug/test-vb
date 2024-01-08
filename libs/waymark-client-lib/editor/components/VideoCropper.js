// Vendor
import _ from 'lodash';
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import Cropper from 'editor/components/Cropper.js';
import {
    modificationConfigurationPaths,
    defaultCropModificationValue,
} from 'editor/constants/EditorVideo.js';

/**
 * Renders a crop UI overlay which will update the video field's crop modifications
 *
 * @param {object}  currentConfigurationValue   The current value stored in the configuration for the video field
 * @param {func}    updateVideoModification   Function that updates a modification value for the video field's configuration
 */
export default function VideoCropper({
    currentConfigurationValue,
    updateVideoModification
}) {
    // Memoizing with useCallback because this is used as a dependency of an effect
    const onChangeCropData = useCallback(
        (newCropData) => {
            updateVideoModification(newCropData, modificationConfigurationPaths.cropping.all);
        }, [updateVideoModification],
    );

    const currentCropData = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.cropping.all,
        defaultCropModificationValue,
    );

    return <Cropper externalCropData = {
        currentCropData
    }
    onChangeCropData = {
        onChangeCropData
    }
    />;
}
VideoCropper.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoModification: PropTypes.func.isRequired,
};