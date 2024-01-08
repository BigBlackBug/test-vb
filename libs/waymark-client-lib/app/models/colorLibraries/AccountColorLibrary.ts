import { getOrCreateDefaultAccountColorLibrary } from './mutations';
import BaseEditableColorLibrary from './BaseEditableColorLibrary';
import { getColorLibraryDataFromNode } from './utils';
import { FormattedColorLibraryData } from './types';

export default class AccountColorLibrary extends BaseEditableColorLibrary {
  accountGUID: string | null = null;

  constructor({
    accountGUID,
    ...colorLibraryData
  }: FormattedColorLibraryData & {
    accountGUID: string;
  }) {
    super(colorLibraryData);

    this.accountGUID = accountGUID || null;
  }

  /**
   * If this AccountColorLibrary instance is a placeholder, this method will get/create
   * a default color library for the account and update this instance to track that new library.
   */
  async createColorLibrary() {
    if (!this.accountGUID) return null;

    const result = await getOrCreateDefaultAccountColorLibrary(this.accountGUID);

    if (!result) return null;

    this.guid = result.colorLibrary.guid;
    this.displayName = result.colorLibrary.displayName;

    return getColorLibraryDataFromNode(result.colorLibrary);
  }
}
