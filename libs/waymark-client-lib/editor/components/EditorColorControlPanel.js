// Vendor
import {
    useState
} from 'react';

// Local
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow.js';
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import EditorColorField from 'editor/components/EditorColorField.js';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import EditorColorLibrary from 'editor/components/EditorColorLibrary.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';

// Shared
import * as styles from './EditorColorControlPanel.css';

/**
 * Header with back button to close color panel and reset button to reset colors
 * to template defaults
 */
const EditorColorHeader = () => {
    return ( <
        HeaderButtonRow > { /* Closes the color control panel and returns to the main panel */ } <
        BaseHeaderBackButton / >
        <
        /HeaderButtonRow>
    );
};

/**
 * Provides interface for user to add custom colors or pick from a list of colors to apply to
 * various shape and text colors in the video
 */
const EditorColorControls = () => {
    // Get all color fields
    const colorFields = useEditorFieldsOfType(VideoEditingFieldTypes.color);

    // Keep track of the field key, hex code and update function for the currently selected color field
    const [currentlyEditingFieldInfo, setCurrentlyEditingFieldInfo] = useState(null);

    // Get the hex code and update function for the currently selected image field
    const {
        hexCode: currentHexCode,
        updateConfigurationValue: updateCurrentField
    } =
    currentlyEditingFieldInfo || {};

    return ( <
        >
        <
        EditorControlPanelHeading heading = "Colors"
        subheading = "Select a color tile and use the below palette to change it. For a specific color, use the plus icon to search based on hex code." /
        >
        <
        div className = {
            styles.ColorFields
        } > {
            colorFields.map((fieldConfig) => ( <
                EditorColorField key = {
                    fieldConfig.editingFieldKey
                }
                colorFieldConfig = {
                    fieldConfig
                }
                hasEditFocus = {
                    currentlyEditingFieldInfo &&
                    currentlyEditingFieldInfo.editingFieldKey === fieldConfig.editingFieldKey
                }
                updateSelectedFieldInfo = {
                    setCurrentlyEditingFieldInfo
                }
                />
            ))
        } <
        /div> <
        div className = {
            styles.ColorLibraries
        }
        // Libraries are faded/disabled until the user has selected a color field to edit
        { ...styles.dataIsActive(Boolean(currentlyEditingFieldInfo))
        } >
        <
        EditorColorLibrary onSelectLibraryColor = {
            (hexCode) => {
                // Update the configuration values for the currently selected color field with a new hex code, if a field is selected
                if (updateCurrentField) {
                    updateCurrentField(hexCode);
                }
            }
        }
        currentlySelectedColor = {
            currentHexCode
        }
        /> <
        /div> <
        />
    );
};

/**
 * Constructing and exporting an object that can be consumed by the EditorControlPanel component to render the appropriate
 * components for this editor control panel
 *
 * The output format is an object with the structure:
 * {
 *   Header: HeaderComponent,
 *   Controls: ControlsComponent,
 *   Provider: ProviderComponent (optional)
 * }
 */
export default makeEditorControlPanel(EditorColorHeader, EditorColorControls);