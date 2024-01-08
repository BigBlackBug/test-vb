import { getOrCreateDefaultBusinessFontLibrary } from './mutations';

import BaseEditableFontLibrary from './BaseEditableFontLibrary';
import { FormattedFontLibraryData } from './utils';

export default class BusinessFontLibrary extends BaseEditableFontLibrary {
  businessGUID: string;

  constructor({
    businessGUID,
    ...fontLibraryData
  }: { businessGUID: string } & FormattedFontLibraryData) {
    super(fontLibraryData);

    this.businessGUID = businessGUID;
  }

  /**
   * If this BusinessFontLibrary instance is a placeholder, this method will get/create
   * a default font library for the business and update this instance to track that new library.
   */
  async createFontLibrary() {
    // Get or create default FontLibrary + BusinessFontLibrary records for the business
    const formattedCreatedFontLibrary = await getOrCreateDefaultBusinessFontLibrary(
      this.businessGUID,
    );

    if (formattedCreatedFontLibrary) {
      this.guid = formattedCreatedFontLibrary.guid;
      this.displayName = formattedCreatedFontLibrary.displayName;
      this.setAssets(formattedCreatedFontLibrary.fonts);
    }

    return formattedCreatedFontLibrary;
  }
}
