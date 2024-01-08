// Vendor
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';

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
    fitFillAlignments
} from 'shared/WaymarkAuthorWebRenderer.js';
import AspectRatioWrapper from 'shared/components/AspectRatioWrapper';
import {
    DynamicBackgroundProgressiveImage
} from 'shared/components/DynamicBackgroundProgressiveImage';

import * as styles from './ImageField.css';

const overridePathRegex = /imageOverride.*/;

/**
 * An editor field which allows the user to edit a certain image in the video
 *
 * @param {object}  imageFieldConfig    The config for this image field - includes data like the field display time and the image's aspect ratio
 * @param {func}    onFieldFocus        Jumps the video to the image field's display time
 */
export default function ImageField({
    imageFieldConfig,
    onFieldFocus
}) {
    // Get the url from the imageFieldConfig, regardless of whether it's a rich image object
    // or a plain url string
    // Destructuring hook before using so that we can take advantage of eslint rules of hooks
    const {
        useCurrentImageURL,
        useUpdateConfigurationLayerData,
        useCurrentConfigurationValue,
        paths,
    } = imageFieldConfig;
    const imageURL = useCurrentImageURL();

    // If any of the paths being updated are an imageOverride, we don't want to show the image alignment dropdown
    const isOverride = Boolean(paths.find((path) => overridePathRegex.test(path)));

    const currentConfigurationValue = useCurrentConfigurationValue();
    const updateConfigurationLayerData = useUpdateConfigurationLayerData();

    const {
        openControlPanel
    } = useEditorPanelDispatch();

    const onClickImageField = useCallback(() => {
        // Jump video to the time when this field is visible
        onFieldFocus();

        // Opens EditorImageControls so the user can select a new photo from their library to use
        // for this field
        openControlPanel(editorPanelKeys.image, {
            selectedImageFieldKey: imageFieldConfig.editingFieldKey,
        });
    }, [openControlPanel, imageFieldConfig, onFieldFocus]);

    const onChangeImageAlignment = useCallback(
        ({
            target
        }) => {
            updateConfigurationLayerData('fitFillAlignment', target.value);
        }, [updateConfigurationLayerData],
    );

    return ( <
        div className = {
            styles.FieldImageContainer
        } >
        <
        WaymarkButton analyticsAction = "selected_image_field"
        onClick = {
            onClickImageField
        }
        onFocus = {
            onFieldFocus
        }
        hasFill = {
            false
        }
        className = {
            styles.FieldImageSelectorButton
        } >
        <
        AspectRatioWrapper aspectRatio = "1:1" > {
            imageURL && ( <
                DynamicBackgroundProgressiveImage src = {
                    imageURL
                }
                alt = {
                    imageFieldConfig.label
                }
                className = {
                    styles.FieldImage
                }
                imageWrapperClassName = {
                    styles.FieldImageWrapper
                }
                />
            )
        } <
        /AspectRatioWrapper> <
        /WaymarkButton> {
            window.shouldShowImageAlignment && !isOverride ? ( <
                select onChange = {
                    onChangeImageAlignment
                }
                defaultValue = {
                    fitFillAlignments.centerCenter
                }
                value = {
                    currentConfigurationValue.fitFillAlignment || fitFillAlignments.centerCenter
                } >
                {
                    Object.keys(fitFillAlignments).map((key) => ( <
                        option key = {
                            key
                        }
                        value = {
                            fitFillAlignments[key]
                        } > {
                            key
                        } <
                        /option>
                    ))
                } <
                /select>
            ) : null
        } <
        /div>
    );
}

ImageField.propTypes = {
    imageFieldConfig: editorPropTypes.editorImageField.isRequired,
    onFieldFocus: PropTypes.func.isRequired,
};