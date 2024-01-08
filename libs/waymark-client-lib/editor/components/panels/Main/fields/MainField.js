// Vendor
import PropTypes from 'prop-types';

// Editor
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import editorPropTypes from 'editor/constants/editorPropTypes.js';

// Shared
import SelectInput from 'shared/components/SelectInput';
import {
    useJumpVideoToTime
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

// Fields
import ImageField from './ImageField.js';
import VideoField from './VideoField.js';
import TextField from './TextField';

import {
    ImageFormField,
    TextFormField,
    VideoFormField
} from '@libs/shared-types';

/**
 * Handles rendering the correct kind of main field based on its type
 *
 * @param {Object} props
 * @param {TextFormField | ImageFormField | VideoFormField}  props.mainFieldConfig   Config object for this field
 * @param {bool}    [props.isInLayoutGroup=false]   Whether this field is contained in a layout group
 */
export default function MainField({
    mainFieldConfig,
    isInLayoutGroup = false
}) {
    const {
        type,
        displayTime,
        // Destructuring hooks before using so that we can take advantage of eslint rules of hooks
        useCurrentConfigurationValue,
        useUpdateConfigurationValue,
    } = mainFieldConfig;

    const configurationValue = useCurrentConfigurationValue();
    const updateConfigurationValue = useUpdateConfigurationValue();

    const jumpVideoToTime = useJumpVideoToTime();

    const onFieldFocus = () => {
        if (displayTime != null) {
            jumpVideoToTime(displayTime);
        }
    };

    switch (type) {
        case VideoEditingFieldTypes.text:
            return ( <
                TextField editingFieldKey = {
                    mainFieldConfig.editingFieldKey
                }
                characterLimit = {
                    mainFieldConfig.characterLimit
                }
                updateConfigurationValue = {
                    updateConfigurationValue
                }
                onFieldFocus = {
                    onFieldFocus
                }
                configurationValue = {
                    configurationValue
                }
                />
            );
        case VideoEditingFieldTypes.textSelector:
            {
                const onFieldChange = (event) => updateConfigurationValue(event.target.value);

                return ( <
                    SelectInput fieldProps = {
                        {
                            onBlur: onFieldChange,
                            onChange: onFieldChange,
                            onFocus: onFieldFocus,
                            // This only sets the input's initial value
                            value: configurationValue,
                        }
                    }
                    options = {
                        mainFieldConfig.selectOptions.map((option) => ({
                            text: option.label,
                            value: option.configurationValue,
                        }))
                    }
                    />
                );
            }
        case VideoEditingFieldTypes.image:
            return ( <
                ImageField imageFieldConfig = {
                    mainFieldConfig
                }
                onFieldFocus = {
                    onFieldFocus
                }
                isInLayoutGroup = {
                    isInLayoutGroup
                }
                />
            );
        case VideoEditingFieldTypes.video:
            return ( <
                VideoField videoFieldConfig = {
                    mainFieldConfig
                }
                onFieldFocus = {
                    onFieldFocus
                }
                isInLayoutGroup = {
                    isInLayoutGroup
                }
                />
            );
        default:
            console.error(`EditorMainField does not currently support fields of type ${type}`);
            return null;
    }
}

MainField.propTypes = {
    mainFieldConfig: editorPropTypes.editorMainField.isRequired,
    isInLayoutGroup: PropTypes.bool,
};