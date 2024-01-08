/* eslint-disable import/prefer-default-export */

// Editor
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    useEditorPanelState
} from 'editor/providers/EditorPanelProvider';

/**
 * Finds and returns the video field currently selected for editing based on the panel mode context
 *
 * @returns {EditorVideoField}  The video field currently selected for editing
 */
export const useSelectedEditorVideoField = () => {
    const mainFields = useEditorFieldsOfType(VideoEditingFieldTypes.main);

    // Get the panel context - this will be set when the user clicks to open a video field in the video control panel
    const {
        currentPanel: {
            sharedContext
        },
    } = useEditorPanelState();

    const selectedVideoFieldKey = sharedContext ? .selectedVideoFieldKey;

    if (selectedVideoFieldKey) {
        for (let i = 0, numMainFields = mainFields.length; i < numMainFields; i += 1) {
            const field = mainFields[i];

            if (field.editingFieldKey === selectedVideoFieldKey) {
                return field;
            }
            if (field.type === VideoEditingFieldTypes.layoutSelector) {
                for (
                    let j = 0, numSelectOptions = field.selectOptions.length; j < numSelectOptions; j += 1
                ) {
                    const selectOption = field.selectOptions[j];

                    const matchingLayoutField = selectOption.contentFields.find(
                        ({
                            editingFieldKey
                        }) => editingFieldKey === selectedVideoFieldKey,
                    );

                    if (matchingLayoutField) return matchingLayoutField;
                }
            }
        }
    }

    return null;
};