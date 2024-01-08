import BaseFontLibrary from './BaseFontLibrary';

/**
 * A static font library that can be displayed in the UI but never edited
 * ie, a global font library or an account group font library
 */
export default class StaticFontLibrary extends BaseFontLibrary {
  isEditable = false;
}
