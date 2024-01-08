import { getOrCreateDefaultBusinessColorLibrary } from './mutations';
import BaseEditableColorLibrary from './BaseEditableColorLibrary';
import { getColorLibraryDataFromNode } from './utils';
import { FormattedColorLibraryData } from './types';

export default class BusinessColorLibrary extends BaseEditableColorLibrary {
  businessGUID: string | null = null;

  constructor({
    businessGUID,
    ...colorLibraryData
  }: FormattedColorLibraryData & { businessGUID: string }) {
    super(colorLibraryData);

    this.businessGUID = businessGUID || null;
  }

  /**
   * If this BusinessColorLibrary instance is a placeholder, this method will get/create
   * a default color library for the business and update this instance to track that new library.
   */
  async createColorLibrary() {
    if (!this.businessGUID) return null;

    const result = await getOrCreateDefaultBusinessColorLibrary(this.businessGUID);

    if (!result) return null;

    this.guid = result.colorLibrary.guid;
    this.displayName = result.colorLibrary.displayName;

    return getColorLibraryDataFromNode(result.colorLibrary);
  }
}
