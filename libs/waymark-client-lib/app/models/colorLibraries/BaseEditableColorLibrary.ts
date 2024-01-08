// Mutations
import { updateOrAddColorToColorLibrary, deleteColorFromColorLibrary } from './mutations';

// Models
import BaseColorLibrary from './BaseColorLibrary';
import Color from './Color';
import { FormattedColorLibraryData } from './types';

export default class EditableColorLibrary extends BaseColorLibrary {
  isEditable = true;

  /**
   * If this EditableColorLibrary instance doesn't have a guid, it does not currently
   * map to an existing ColorLibrary record in the database. In that case,
   * any mutations will need to create a new ColorLibrary record first and store that library's
   * data on this instance
   */
  get isPlaceholder() {
    return !this.guid;
  }

  /**
   * If this EditableFontLibrary instance is a placeholder, this method will get/create
   * a font library and update this instance to track that new library.
   *
   * NOTE: This method must be implemented on all classes which extend the `EditableColorLibrary` class.
   */
  async createColorLibrary(): Promise<FormattedColorLibraryData | null> {
    throw new Error(
      `Not implemented: 'createColorLibrary' must be implemented on class ${this.constructor.name}`,
    );
  }

  /**
   * Adds a new color to this library
   *
   * @param {string} hexCode  The hex code of the color to add
   */
  async addColor(hexCode: string) {
    try {
      if (this.isPlaceholder) {
        // If this ColorLibrary instance is a placeholder, create a color library which we can add the color to first
        // NOTE: this needs to be implemented in subclasses of EditableColorLibrary, ie AccountColorLibrary/BusinessColorLibrary
        await this.createColorLibrary();

        if (this.isPlaceholder) {
          // If the color library is still a placeholder because it failed to be created, log an error and return null
          console.error(`Failed to create color library before adding color "${hexCode}"`);
          return null;
        }
      }

      const mutationResultData = await updateOrAddColorToColorLibrary(this.guid as string, hexCode);

      return mutationResultData?.color ?? null;
    } catch (error) {
      console.error(
        `Something went wrong while attempting to add color "${hexCode}" to color library ${this.constructor.name}(${this.guid})`,
        error,
      );
    }

    return null;
  }

  /**
   * Removes a Color from this library
   *
   * @param {Color} colorToRemove   A Color instance to remove from this librarys
   */
  async removeColor(colorToRemove: Color) {
    if (this.isPlaceholder || !this.guid) {
      return false;
    }

    try {
      await deleteColorFromColorLibrary(this.guid, colorToRemove.hexCode);

      return true;
    } catch (error) {
      console.error(`Error removing color "${colorToRemove.hexCode}" from library:`, error);
    }

    return false;
  }
}
