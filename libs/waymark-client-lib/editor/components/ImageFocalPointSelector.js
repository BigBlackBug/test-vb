// Vendor
import _ from 'lodash';
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    ImageModificationKeys,
    DefaultImageModifications,
    FitFillModes,
} from 'editor/constants/EditorImage.js';
import FocalPointSelector from 'editor/components/FocalPointSelector.js';

/**
 * Renders a focal point selector UI overlay which updates the focal point data
 * for the image field's configuration
 *
 * @param {func}  useCurrentImageModificationsValue   Hook gets given modification values from the image field's configuration
 * @param {func}  updateImageModifications    Updates modifications on the image field's configuration
 */
export default function ImageFocalPointSelector({
    useCurrentImageModificationsValue,
    updateImageModifications,
}) {
    // Get the current zoom image modifications
    const currentZoomModifications =
        useCurrentImageModificationsValue(ImageModificationKeys.zoom) ||
        // Fall back to the default zoom values
        DefaultImageModifications[FitFillModes.fillContainer].zoom;

    // Memoizing with useCallback because this is used as a dependency of an effect
    const onChangeFocalPoint = useCallback(
        (newFocalPoint) => {
            updateImageModifications(
                (currentZoomModificationValue) => ({
                    x: newFocalPoint.x,
                    y: newFocalPoint.y,
                    // Maintain the existing z value or fill in the default value of 1
                    z: _.get(currentZoomModificationValue, 'z', 1),
                }),
                ImageModificationKeys.zoom,
            );
        }, [updateImageModifications],
    );

    return ( <
        FocalPointSelector externalFocalPointPosition = {
            currentZoomModifications
        }
        onChangeFocalPoint = {
            onChangeFocalPoint
        }
        />
    );
}
ImageFocalPointSelector.propTypes = {
    useCurrentImageModificationsValue: PropTypes.func.isRequired,
    updateImageModifications: PropTypes.func.isRequired,
};