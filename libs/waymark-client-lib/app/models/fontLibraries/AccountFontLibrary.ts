import { getOrCreateDefaultAccountFontLibrary } from './mutations';

import BaseEditableFontLibrary from './BaseEditableFontLibrary';
import { FormattedFontLibraryData } from './utils';

export default class AccountFontLibrary extends BaseEditableFontLibrary {
  accountGUID: string;

  constructor({
    accountGUID,
    ...fontLibraryData
  }: { accountGUID: string } & FormattedFontLibraryData) {
    super(fontLibraryData);

    this.accountGUID = accountGUID;
  }

  /**
   * If this AccountFontLibrary instance is a placeholder, this method will get/create
   * a default font library for the account and update this instance to track that new library.
   */
  async createFontLibrary() {
    // Get or create default FontLibrary + AccountFontLibrary records for the account
    const formattedCreatedFontLibrary = await getOrCreateDefaultAccountFontLibrary(
      this.accountGUID,
    );

    if (formattedCreatedFontLibrary) {
      this.guid = formattedCreatedFontLibrary.guid;
      this.displayName = formattedCreatedFontLibrary.displayName;
      this.setAssets(formattedCreatedFontLibrary.fonts);
    }

    return formattedCreatedFontLibrary;
  }
}
