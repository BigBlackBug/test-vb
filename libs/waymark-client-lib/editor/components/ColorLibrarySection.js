// Vendor
import PropTypes from 'prop-types';
import {
    css,
    cx as emotionClassNames
} from '@emotion/css';

// Editor
import {
    EditorControlSectionHeading
} from 'editor/components/EditorControlHeadings';
import BaseColorLibrary from 'app/models/colorLibraries/BaseColorLibrary';
import ColorLibraryListItem from 'editor/components/ColorLibraryListItem';
import AddColorToColorLibraryButton from 'editor/components/AddColorToColorLibraryButton';

// Show library colors in a grid with 6 per row
const colorLibraryGridStyle = css `
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-gap: 8px;
  margin-bottom: 48px;
`;

/**
 * Renders a grid of colors in a ColorLibrary, along with a UI to add colors to the library if
 * the library is editable
 *
 * @param {ColorLibrary} colorLibrary   The ColorLibrary instance whose colors we should display
 * @param {string}  [displayName]       Name to display in a heading above the library section
 * @param {func}  [onSelectLibraryColor]  Callback fired when the user clicks to "select" a color in the library
 * @param {string}  [currentlySelectedColor]  The hex code for the color that is currently selected, if applicable
 */
export default function ColorLibrarySection({
    colorLibrary,
    sectionDisplayName,
    onSelectLibraryColor,
    currentlySelectedColor,
    colorLibraryClassName = null,
    maxColors = null,
}) {
    const colors = colorLibrary.assets;

    return ( <
        > {
            sectionDisplayName ? ( <
                EditorControlSectionHeading heading = {
                    sectionDisplayName
                }
                className = {
                    css `
            /* Add margin under the heading for each section of the color library */
            margin-bottom: 18px;
          `
                }
                />
            ) : null
        } <
        div className = {
            emotionClassNames(colorLibraryGridStyle, colorLibraryClassName)
        } > {
            colors.map((color) => {
                const {
                    hexCode
                } = color;

                return ( <
                    ColorLibraryListItem key = {
                        hexCode
                    }
                    hexCode = {
                        hexCode
                    }
                    displayName = {
                        color.displayName || hexCode
                    }
                    onSelectLibraryColor = {
                        onSelectLibraryColor
                    }
                    isSelected = {
                        currentlySelectedColor === hexCode.toUpperCase()
                    }
                    removeColorFromLibrary = {
                        colorLibrary.isEditable ? () => colorLibrary.removeColor(color) : null
                    }
                    />
                );
            })
        } {
            colorLibrary.isEditable && (!maxColors || colors.length < maxColors) ? ( <
                AddColorToColorLibraryButton colorLibrary = {
                    colorLibrary
                }
                onSelectLibraryColor = {
                    onSelectLibraryColor
                }
                defaultHexCode = {
                    currentlySelectedColor
                }
                />
            ) : null
        } <
        /div> <
        />
    );
}
ColorLibrarySection.propTypes = {
    colorLibrary: PropTypes.instanceOf(BaseColorLibrary).isRequired,
    onSelectLibraryColor: PropTypes.func,
    currentlySelectedColor: PropTypes.string,
    sectionDisplayName: PropTypes.string,
    colorLibraryClassName: PropTypes.string,
    maxColors: PropTypes.number,
};
ColorLibrarySection.defaultProps = {
    sectionDisplayName: null,
    onSelectLibraryColor: null,
    currentlySelectedColor: null,
    colorLibraryClassName: null,
    maxColors: null,
};