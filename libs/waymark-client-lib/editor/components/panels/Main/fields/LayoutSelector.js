// Vendor
import _ from 'lodash';
import {
    useCallback,
    useMemo
} from 'react';

// Local
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';

// Shared
import SelectInput from 'shared/components/SelectInput';
import {
    useJumpVideoToTime
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import {
    LayoutSelectorFormField
} from '@libs/shared-types';

import MainField from './MainField.js';

import * as styles from './LayoutSelector.css';

/**
 * Selector dropdown input which can modify the configuration to change which fields should be rendered in the editor form
 *
 * @param {Object} props
 * @param {LayoutSelectorFormField} props.layoutSelectorConfig Editor field config describing this layout selector and the options it can switch between
 */
export default function LayoutSelector({
    layoutSelectorConfig
}) {
    const {
        displayTime,
        // Destructuring hooks before using so that we can take advantage of eslint rules of hooks
        useCurrentConfigurationValue,
        useUpdateConfigurationValue,
    } = layoutSelectorConfig;

    const currentConfigurationValue = useCurrentConfigurationValue();
    const updateConfigurationValue = useUpdateConfigurationValue();

    const jumpVideoToTime = useJumpVideoToTime();

    const onFieldFocus = () => {
        if (displayTime != null) {
            jumpVideoToTime(displayTime);
        }
    };

    // Get the content fields for the selected layout option
    const selectedLayoutFields = useMemo(() => {
        const selectedOption =
            _.find(layoutSelectorConfig.selectOptions, {
                configurationValue: currentConfigurationValue,
            }) ||
            // Fall back to the first select option if the configuration value doesn't
            // have a valid match
            layoutSelectorConfig.selectOptions[0];

        return selectedOption.contentFields;
    }, [currentConfigurationValue, layoutSelectorConfig.selectOptions]);

    // Stores a new value in the configuration for which fields should be displayed in the field group
    const onSelectLayout = useCallback(
        (event) => {
            updateConfigurationValue(event.target.value);
        }, [updateConfigurationValue],
    );

    return ( <
        div className = {
            styles.LayoutSelectorContainer
        } >
        <
        h3 className = {
            styles.LayoutSelectorLabel
        } > {
            layoutSelectorConfig.label
        } < /h3> <
        SelectInput fieldProps = {
            {
                onBlur: onSelectLayout,
                onChange: onSelectLayout,
                onFocus: onFieldFocus,
                value: currentConfigurationValue,
                className: styles.Selector,
            }
        }
        options = {
            layoutSelectorConfig.selectOptions.map((fieldOption) => ({
                text: fieldOption.label,
                value: fieldOption.configurationValue,
            }))
        }
        /> <
        div className = {
            styles.SelectedFields
        } > {
            selectedLayoutFields.map(
                (layoutFieldConfig) =>
                layoutFieldConfig && ( <
                    div key = {
                        layoutFieldConfig.editingFieldKey
                    }
                    className = {
                        layoutFieldConfig.type !== VideoEditingFieldTypes.image &&
                        layoutFieldConfig.type !== VideoEditingFieldTypes.video ?
                        styles.ShouldFillRow :
                            ''
                    } >
                    <
                    MainField mainFieldConfig = {
                        layoutFieldConfig
                    }
                    /> <
                    /div>
                ),
            )
        } <
        /div> <
        /div>
    );
}