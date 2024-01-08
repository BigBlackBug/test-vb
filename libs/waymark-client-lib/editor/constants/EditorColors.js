import {
    makeColorGrid
} from 'editor/utils/editorColors.js';
import StaticColorLibrary from 'app/models/colorLibraries/StaticColorLibrary';

// Generate a 6x11 grid of "basic colors"
const BASIC_COLOR_LIBRARY_COLUMNS_COUNT = 6;
// Array of hue values to use for each basic color library row
const basicColorRowHues = [0, 24, 44, 72, 126, 180, 225, 256, 284, 317];

const basicColorLibraryColors = makeColorGrid(basicColorRowHues, BASIC_COLOR_LIBRARY_COLUMNS_COUNT);

// Set up a static ColorLibrary instance with basic colors that all users will see
export const basicColorLibrary = new StaticColorLibrary({
    displayName: 'Basic Colors',
    colors: basicColorLibraryColors,
    guid: null,
});

// Maps hex codes for basic known colors to appropriate names
export const knownColorNames = {
    '#FFFFFF': 'White',
    '#000000': 'Black',
    '#FF0000': 'Red',
    '#00FF00': 'Green',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#00FFFF': 'Aqua',
    '#FF00FF': 'Magenta',
};

export const baseEditorColorOptions = {
    transparent: '#ffffff00',
    white: '#ffffff',
    black: '#000000',
};