// Vendor
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Styles
import {
    themeVars
} from '@libs/shared-ui-styles';

// Editor
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';
import {
    baseEditorColorOptions
} from 'editor/constants/EditorColors.js';
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    useEditorState
} from 'editor/providers/EditorStateProvider.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

const transparentColorSwatchButtonStyle = css `
  /* Show a checkered gradient pattern for transparent color button */
  background-size: 20px 20px;
  background-position: 0 0, 50px 50px;
  background-image: linear-gradient(
      45deg,
      ${themeVars.color.shadow._16} 25%,
      transparent 25%,
      transparent 75%,
      ${themeVars.color.shadow._16} 75%,
      ${themeVars.color.shadow._16}
    ),
    linear-gradient(
      45deg,
      ${themeVars.color.shadow._16} 25%,
      transparent 25%,
      transparent 75%,
      ${themeVars.color.shadow._16} 75%,
      ${themeVars.color.shadow._16}
    );
  background-color: ${themeVars.color.white};
`;

const whiteColorSwatchButtonStyle = css `
  border: 1px solid ${themeVars.color.shadow._16};
`;

/**
 * Button selects a color to use as a new configuration color value
 *
 * @param {string} hexColor   The hex code that this button should select
 * @param {bool} isSelected   If the color is the currently selected configuration color value
 * @param {string} onSelectFillColor   Callback function when color swatch is selected
 */
const ColorSwatchButton = ({
    hexColor,
    isSelected,
    onSelectFillColor
}) => {
    const selectedColorSwatchButtonStyle = css `
    border: 3px solid ${themeVars.color.brand.default};
  `;

    return ( <
        WaymarkButton onClick = {
            () => onSelectFillColor(hexColor)
        }
        className = {
            emotionClassNames(
                css `
          border-radius: 50% !important;
          border: 1px solid ${themeVars.color.white};
          width: 40px;
          height: 40px;
          padding: 0 !important;
          margin: 4px 7px 0 0;
          box-sizing: border-box;

          &:last-child {
            margin-right: 0;
          }
        `, {
                    [transparentColorSwatchButtonStyle]: hexColor === baseEditorColorOptions.transparent,
                    [whiteColorSwatchButtonStyle]: hexColor === baseEditorColorOptions.white,
                    [selectedColorSwatchButtonStyle]: isSelected,
                },
            )
        }
        style = {
            {
                backgroundColor: hexColor,
            }
        }
        />
    );
};
ColorSwatchButton.propTypes = {
    hexColor: PropTypes.string.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelectFillColor: PropTypes.func.isRequired,
};

/**
 * Displays color swatch buttons which allow the user to choose a new configuration color value.
 *
 * @param {func} onSelectFillColor   Callback function when user selects new color swatch
 * @param {string} selectedFillColor   The current configuration color value
 * @param {array} [baseHexColors]         Base hex colors to always include
 * @param {array} [additionalHexColors]   Optional additional hex colors to display
 */
const EditorFillColorControls = ({
    onSelectFillColor,
    selectedFillColor,
    baseHexColors,
    additionalHexColors,
}) => {
    const {
        configuration
    } = useEditorState();

    const colorFields = useEditorFieldsOfType(VideoEditingFieldTypes.color) || [];
    // Get the current configuration value (hex color code) for each color editing field
    const baseAndTemplateColors = colorFields.reduce((displayColors, colorField) => {
        const hexColor = _.get(configuration, colorField.paths[0]);
        displayColors.push(hexColor);

        return displayColors;
        // Start with our base fill colors: transparent, white, black
    }, baseHexColors);

    // Add any additional colors and strip out any duplicates
    const availableColors = _.uniqBy([...baseAndTemplateColors, ...additionalHexColors], _.upperCase);

    return ( <
        div className = {
            css `
        display: flex;
        align-items: center;
        flex-wrap: wrap;
      `
        } >
        {
            availableColors &&
            availableColors.map((hexColor) => ( <
                ColorSwatchButton key = {
                    hexColor
                }
                hexColor = {
                    hexColor
                }
                isSelected = {
                    selectedFillColor === hexColor
                }
                onSelectFillColor = {
                    onSelectFillColor
                }
                />
            ))
        } <
        /div>
    );
};
EditorFillColorControls.propTypes = {
    onSelectFillColor: PropTypes.func.isRequired,
    selectedFillColor: PropTypes.string,
    baseHexColors: PropTypes.arrayOf(PropTypes.string),
    additionalHexColors: PropTypes.arrayOf(PropTypes.string),
};
EditorFillColorControls.defaultProps = {
    additionalHexColors: [],
    baseHexColors: [
        baseEditorColorOptions.transparent,
        baseEditorColorOptions.white,
        baseEditorColorOptions.black,
    ],
    selectedFillColor: null,
};

export default EditorFillColorControls;