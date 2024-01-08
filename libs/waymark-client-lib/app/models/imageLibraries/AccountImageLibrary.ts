// Local
import { getOrCreateDefaultAccountImageLibrary } from 'shared/api/graphql/imageLibraries/mutations';
import BaseEditableImageLibrary from './BaseEditableImageLibrary';
import { FormattedImageLibraryData } from './types';
import { getImageLibraryDataFromNode } from './utils';

export default class AccountImageLibrary extends BaseEditableImageLibrary {
  accountGUID: string | null;

  constructor({
    accountGUID,
    ...imageLibraryData
  }: {
    accountGUID: string | null;
  } & FormattedImageLibraryData) {
    super(imageLibraryData);

    this.accountGUID = accountGUID || null;
  }

  /**
   * If this image library instance is a placeholder, this method will get/create
   * a default font library for the account and update this instance to track that new library.
   */
  async createImageLibrary() {
    if (!this.accountGUID) {
      return null;
    }

    // Get or create default FontLibrary + AccountFontLibrary records for the business
    const result = await getOrCreateDefaultAccountImageLibrary(this.accountGUID);

    if (!result) {
      return null;
    }

    this.slug = result.imageLibrary.slug;
    this.displayName = result.imageLibrary.displayName;

    return getImageLibraryDataFromNode(result.imageLibrary);
  }
}
