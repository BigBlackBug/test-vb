/**
 * Class represents basic data available on all image types.
 *
 * @class ImageAsset
 */
export default class ImageAsset {
  guid: string;
  baseImageURL: string;
  displayName: string | null;
  isLogo: boolean;
  order: number;
  updatedAt: Date | null;
  removedAt: Date | null;
  width?: number;
  height?: number;
  upscaledImageURL?: string | null;
  cacheID?: string | null;
  isUpscaled: boolean;
  stockAssetID?: string | null;
  stockSearchID?: string | null;
  source?: string | null;

  get imageURL() {
    if (this.isUpscaled && this.upscaledImageURL) {
      return this.upscaledImageURL;
    }

    return this.baseImageURL;
  }

  constructor({
    guid,
    imageURL,
    displayName = null,
    isLogo = false,
    order = 1,
    updatedAt,
    removedAt,
    width,
    height,
    upscaledImageURL,
    cacheID,
    stockAssetID = null,
    stockSearchID = null,
    source = null,
  }: {
    guid: string;
    imageURL: string;
    displayName?: string | null;
    isLogo?: boolean;
    order?: number;
    updatedAt: string | null;
    removedAt: string | null;
    width?: number;
    height?: number;
    upscaledImageURL?: string | null;
    cacheID?: string | null;
    stockAssetID?: string | null;
    stockSearchID?: string | null;
    source?: string | null;
  }) {
    this.guid = guid;
    this.baseImageURL = imageURL;
    this.displayName = displayName;
    this.isLogo = isLogo;
    this.upscaledImageURL = upscaledImageURL;

    this.order = order;

    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.removedAt = removedAt ? new Date(removedAt) : null;

    this.width = width;
    this.height = height;

    this.upscaledImageURL = upscaledImageURL;
    // This flag is set dynamically based on the current view so it's defaulted to false initially
    this.isUpscaled = false;

    this.cacheID = cacheID;

    this.stockAssetID = stockAssetID;
    this.stockSearchID = stockSearchID;
    this.source = source;
  }
}
