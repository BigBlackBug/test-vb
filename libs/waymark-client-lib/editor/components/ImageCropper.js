// Vendor
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    ImageModifications,
    DefaultImageModifications,
    FitFillModes,
} from 'editor/constants/EditorImage.js';
import Cropper from 'editor/components/Cropper.js';

const CROPPING_MODIFICATION = ImageModifications.cropping;

/**
 * Displays a UI for cropping images
 *
 * @param {func}  useCurrentImageModificationsValue   Hook gets given modification values from the image field's configuration
 * @param {func}  updateImageModifications    Updates modifications on the image field's configuration
 */
const ImageCropper = ({
    useCurrentImageModificationsValue,
    updateImageModifications
}) => {
    // Get the current crop modification data stored for the image
    const currentCroppingData =
        useCurrentImageModificationsValue(CROPPING_MODIFICATION.path) ||
        // Fall back to the default cropping values
        DefaultImageModifications[FitFillModes.fitImage].cropping;

    // Memoizing with useCallback because this is used as a dependency of an effect
    const onChangeCropData = useCallback(
        (newCropData) => updateImageModifications(newCropData, CROPPING_MODIFICATION.path), [updateImageModifications],
    );

    return <Cropper externalCropData = {
        currentCroppingData
    }
    onChangeCropData = {
        onChangeCropData
    }
    />;
};

ImageCropper.propTypes = {
    useCurrentImageModificationsValue: PropTypes.func.isRequired,
    updateImageModifications: PropTypes.func.isRequired,
};

export default ImageCropper;