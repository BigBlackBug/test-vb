// Mutations
import { addFontToFontLibrary, removeFontFromFontLibrary } from './mutations';

import BaseFontLibrary from './BaseFontLibrary';
import { FormattedFontLibraryData } from './utils';
import Font from './Font';

/**
 * A font library which the user can edit to add/remove fonts
 * ie, a business or account font library
 *
 * NOTE: YOU SHOULD NEVER DIRECTLY USE THIS CLASS. ONLY USE CHILD CLASSES WHICH
 * EXTEND THIS CLASS, SUCH AS `AccountFontLibrary` and `BusinessFontLibrary`
 */
export default class BaseEditableFontLibrary extends BaseFontLibrary {
  isEditable = true;

  /**
   * If this EditableFontLibrary instance doesn't have a guid, it does not currently
   * map to an existing FontLibrary record in the database. In that case,
   * any mutations will need to create a new FontLibrary record first and store that library's
   * data on this instance
   */
  get isPlaceholder() {
    return !this.guid;
  }

  /**
   * If this EditableFontLibrary instance is a placeholder, this method will get/create
   * a font library and update this instance to track that new library.
   *
   * NOTE: This method must be implemented on all classes which extend the `EditableFontLibrary` class.
   */
  async createFontLibrary(): Promise<FormattedFontLibraryData | null> {
    throw new Error(
      `Not implemented: 'createFontLibrary' must be implemented on ${this.constructor.name}`,
    );
  }

  /**
   * Takes a Font instance and fires a mutation to attempt to add it to this library
   *
   * @param {Font} fontToAdd
   */
  async addFont(fontToAdd: Font) {
    if (this.isPlaceholder) {
      // If this FontLibrary instance is a placeholder, create a font library which we can add the font to first
      // NOTE: this needs to be implemented in child classes of EditableFontLibrary, ie AccountFontLibrary/BusinessFontLibrary
      await this.createFontLibrary();

      if (this.isPlaceholder) {
        // If the font library is still a placeholder because it failed to be created, log an error and return null
        console.error(`Failed to create font library before adding font ${fontToAdd.toString()}`);
        return null;
      }
    }

    try {
      if (!this.guid) {
        throw new Error(`Font library ${this.toString()} does not have a guid`);
      }

      // Add the font to this library
      const result = await addFontToFontLibrary(
        this.guid,
        fontToAdd.bfsUUID,
        fontToAdd.displayName,
      );

      if (result) {
        return result.createdFontLibraryFont;
      }
    } catch (error) {
      console.error(
        `Something went wrong while attempting to add font ${fontToAdd.toString()} to font library ${this.toString()}`,
        error,
      );
    }

    return null;
  }

  /**
   * Takes a Font instance and fires a mutation to remove it from this library
   *
   * @param {Font} fontToAdd
   */
  async removeFont(fontToRemove: Font) {
    // Fonts can't be removed from this library if it's a placeholder or not editable
    if (this.isPlaceholder) {
      return false;
    }

    try {
      if (!this.guid) {
        throw new Error(`Font library ${this.toString()} does not have a guid`);
      }

      await removeFontFromFontLibrary(this.guid, fontToRemove.bfsUUID);

      return true;
    } catch (error) {
      console.error('Error removing font from library:', error);
    }

    return false;
  }

  toString() {
    return `${this.constructor.name}(${this.guid})`;
  }
}
