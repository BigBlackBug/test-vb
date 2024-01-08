// Vendor
import {
    useEffect,
    useMemo
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';

// Shared
import {
    whiteColor
} from 'styles/themes/waymark/colors.js';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    useJumpVideoToTime
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import {
    useTypography
} from 'styles/hooks/typography.js';

/**
 * Takes a hex code and searches through the user's color libraries to see if it
 * matches any library color with a descriptive name so we can display that; if no matches are found,
 * just returns the hex code
 *
 * @param {string}  hexCode
 */
function useBestColorNameForHexCode(hexCode) {
    const {
        color: {
            accountColorLibraries,
            appliedBusinessColorLibraries,
            accountGroupColorLibraries
        },
    } = useEditorMediaLibraries();

    return useMemo(() => {
        const combinedLibraryColors = [
            ...appliedBusinessColorLibraries,
            ...accountColorLibraries,
            ...accountGroupColorLibraries,
        ].flatMap((library) => library.assets);

        // Ensure the hex code is all uppercase for guaranteed consistent comparisons
        const comparableHexCode = hexCode.toUpperCase();

        const matchingLibraryColorWithDisplayName = combinedLibraryColors.find(
            ({
                hexCode: libraryColorHexCode,
                displayName
            }) => {
                const comparableLibraryColorHexCode = libraryColorHexCode.toUpperCase();

                return (
                    comparableLibraryColorHexCode === comparableHexCode &&
                    comparableLibraryColorHexCode !== displayName.toUpperCase()
                );
            },
        );

        // If we found a matching color with a custom display name, return that name,
        // but otherwise just use the hex code as a display name
        return matchingLibraryColorWithDisplayName ? .displayName || hexCode;
    }, [hexCode, appliedBusinessColorLibraries, accountColorLibraries, accountGroupColorLibraries]);
}

/**
 * Field representing a color in the video that can be edited
 *
 * @param {object}  colorFieldConfig            The editor field conig for this color field
 * @param {func}    updateSelectedFieldInfo     Updates the color control panel's state for the currently selected coloro field
 *                                                with this field's editing field key, current hex code, and update function.
 *                                                This should be called when the field is initially selected for editing and then
 *                                                whenever its values change while it's still selected so that these changes can be properly reflected in the control panel.
 * @param {bool}    [hasEditFocus=false]        Whether this field is currently being edited in the color editor
 */
const EditorColorField = ({
    colorFieldConfig,
    updateSelectedFieldInfo,
    hasEditFocus
}) => {
    const {
        editingFieldKey,
        // Destructuring hooks before using so that we can take advantage of eslint rules of hooks
        useCurrentConfigurationValue,
        useUpdateConfigurationValue,
        templateManifestEntry,
    } = colorFieldConfig;

    const configurationValue = useCurrentConfigurationValue();
    const hexCode = configurationValue.toUpperCase();

    const updateConfigurationValue = useUpdateConfigurationValue();

    useEffect(() => {
        if (hasEditFocus) {
            // When the field's hex code or update function changes while it's selected, update the values stored in the
            // outer color control panel component accordingly
            // This flow of data is necessary so we can guarantee each color field's hooks
            // are called consistently
            updateSelectedFieldInfo({
                editingFieldKey,
                hexCode,
                updateConfigurationValue
            });
        }
    }, [editingFieldKey, hasEditFocus, hexCode, updateConfigurationValue, updateSelectedFieldInfo]);

    const jumpVideoToTime = useJumpVideoToTime();

    // Check to see if this field's color matches any existing library colors so we can use that
    // color's display name
    const templateManifestDisplayName = templateManifestEntry ? .displayName;
    const hexBasedName = useBestColorNameForHexCode(hexCode);

    const [caption2TextStyle] = useTypography(['caption2']);

    return ( <
        WaymarkButton
        // Highlight the button with a primary blue when focused, otherwise it will be gray
        colorTheme = {
            hasEditFocus ? 'Primary' : 'Secondary'
        }
        onClick = {
            () => {
                jumpVideoToTime(colorFieldConfig.displayTime);
                updateSelectedFieldInfo({
                    editingFieldKey,
                    hexCode,
                    updateConfigurationValue
                });
            }
        }
        className = {
            css `
        padding: 16px 12px !important;
        border-radius: 12px !important;

        display: flex;
        align-items: center;
        flex-direction: column;
      `
        }
        isUppercase = {
            false
        } >
        <
        div className = {
            css `
          width: 44px;
          height: 44px;
          border-radius: 50%;
          /* Have the circle's background color display this field's current color */
          background-color: ${hexCode};
          /* Specifically for pure white colors, we will change the field's border circle color from white to
               gray so that they don't blend together */
          border: 4px solid ${hexCode === whiteColor ? 'rgba(8, 8, 14, 0.1)' : whiteColor};
        `
        }
        /> <
        p className = {
            css `
          ${caption2TextStyle}
          margin: 8px 0 0;
          color: inherit;
        `
        } >
        {
            templateManifestDisplayName ? ? hexBasedName
        } <
        /p> <
        /WaymarkButton>
    );
};

EditorColorField.propTypes = {
    updateSelectedFieldInfo: PropTypes.func.isRequired,
    colorFieldConfig: editorPropTypes.editorColorField.isRequired,
    hasEditFocus: PropTypes.bool,
};

EditorColorField.defaultProps = {
    hasEditFocus: false,
};

export default EditorColorField;