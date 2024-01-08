import { getURLWithoutQueryParams } from 'shared/utils/urls.js';
import { ImageLibraryImage, ImageLibrary } from 'shared/api/graphql/imageLibraries/fragments';
import ImageAsset from './ImageAsset';
import { FormattedImageLibraryData } from './types';

/**
 * Takes an image library image node returned from the graphql API and formats it as an ImageAsset instance
 * which can be stored in an ImageLibrary's assets array
 */
export const getImageAssetFromNode = (
  {
    guid,
    baseUrl,
    displayName,
    order,
    updatedAt,
    removedAt,
    upscaledImageUrl,
    imageWidth,
    imageHeight,
    id,
    stockAssetId,
    stockSearchId,
    source,
    __typename,
  }: ImageLibraryImage,
  isLogo: boolean,
) => {
  if (!guid) {
    throw new Error('ImageLibraryImage guid is required.');
  }

  return new ImageAsset({
    guid,
    imageURL: getURLWithoutQueryParams(baseUrl || undefined),
    displayName,
    order,
    isLogo,
    updatedAt,
    removedAt,
    upscaledImageURL: upscaledImageUrl ? getURLWithoutQueryParams(upscaledImageUrl) : null,
    width: imageWidth || undefined,
    height: imageHeight || undefined,
    stockAssetID: stockAssetId,
    stockSearchID: stockSearchId,
    source,
    cacheID: `${__typename}:${id}`,
  });
};

/**
 * Takes an image library node returned from the graphql API and formats it into an object which can be safely passed to
 * an ImageLibrary constructor.
 *
 * @param {Object} imageLibraryNode
 * @param {string} [logoImageGUID] - GUID of the selected business' logo image so we can set `isLogo = true` on the appropriate ImageAsset, if applicable
 */
export const getImageLibraryDataFromNode = (
  imageLibraryNode: ImageLibrary,
  logoImageGUID: string | null = null,
): FormattedImageLibraryData => {
  const images: Array<ImageAsset> = [];
  const removedImages: Array<ImageAsset> = [];

  imageLibraryNode.images?.edges.forEach(({ node: imageNode }) => {
    try {
      const asset = getImageAssetFromNode(
        imageNode,
        Boolean(logoImageGUID) && logoImageGUID === imageNode.guid,
      );

      if (asset.removedAt) {
        removedImages.push(asset);
      } else {
        images.push(asset);
      }
    } catch (e) {
      console.error(e);
    }
  });

  return {
    slug: imageLibraryNode.slug,
    displayName: imageLibraryNode.displayName,
    images,
    removedImages,
  };
};
