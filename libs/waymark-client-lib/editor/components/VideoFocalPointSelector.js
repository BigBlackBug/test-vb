import _ from 'lodash';
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import FocalPointSelector from 'editor/components/FocalPointSelector.js';
import {
    modificationConfigurationPaths,
    defaultZoomModificationValue,
} from 'editor/constants/EditorVideo.js';

/**
 * Renders focal point selector UI overlay which will update the video field's focal point modifications
 *
 * @param {Object}    currentConfigurationValue   The current configuration value object stored for the video field
 * @param {function}  updateVideoModification   Updates a modification value in the video field's configuration value
 */
export default function VideoFocalPointSelector({
    currentConfigurationValue,
    updateVideoModification,
}) {
    const currentFocalPointData = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.zoom.all,
        defaultZoomModificationValue,
    );

    // Memoizing with useCallback because this is used as a dependency of an effect
    const onChangeFocalPoint = useCallback(
        (newFocalPoint) => {
            updateVideoModification(
                (currentZoomModificationValue) => ({
                    x: newFocalPoint.x,
                    y: newFocalPoint.y,
                    // Get the focal point's z position or fill in with default so we can
                    // ensure we're creating a valid zoom modification object
                    z: _.get(currentZoomModificationValue, 'z', defaultZoomModificationValue.z),
                }),
                modificationConfigurationPaths.zoom.all,
            );
        }, [updateVideoModification],
    );

    return ( <
        FocalPointSelector externalFocalPointPosition = {
            currentFocalPointData
        }
        onChangeFocalPoint = {
            onChangeFocalPoint
        }
        />
    );
}
VideoFocalPointSelector.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoModification: PropTypes.func.isRequired,
};