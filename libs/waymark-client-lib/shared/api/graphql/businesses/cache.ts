// Utils for managing updating cached business data
import SearchPushBindings, {
  BusinessColorsCreatedPayload,
  BusinessDataUpdatePayload,
  BusinessImagesCreatedPayload,
  EnhancedImagePayload,
  isEnhancedImage,
} from 'app/state/ducks/businessSearch/SearchPushBindings';

import { apolloClient } from '../index';
import { ImageLibraryImage } from '../imageLibraries/fragments';
import { gql } from '@apollo/client';
import { Modifiers } from '@apollo/client/cache';

/**
 * Updates the cached core business data for a given business when business data fanout notifications are received
 */
const onReceivedBusinessDataUpdate = (updatedBusinessData: BusinessDataUpdatePayload) => {
  // Note that the business data we receive from the fanout is missing the __typename, so we need to add it back in
  // to make sure it's compatible with the apollo cache
  const updatedBusinessDataWithTypename = {
    __typename: 'BusinessRelayNode' as const,
    ...updatedBusinessData,
  };

  const updateFieldKeys = Object.keys(updatedBusinessData).join(' ');

  const fragment = gql`
    fragment UpdatedCoreBusinessDetails on BusinessRelayNode {
      ${updateFieldKeys}
    }
  `;

  apolloClient.cache.writeFragment({
    fragment: fragment,
    data: updatedBusinessDataWithTypename,
  });
};

/**
 * Updates the cached business and business image library when new image fanout notifications are received
 */
const onReceivedBusinessImages = (
  newBusinessImagesOrEnhancedImage: BusinessImagesCreatedPayload | EnhancedImagePayload,
) => {
  if (isEnhancedImage(newBusinessImagesOrEnhancedImage)) {
    return;
  }

  const businessGUID = newBusinessImagesOrEnhancedImage.businessGuid;
  const newBusinessImages = newBusinessImagesOrEnhancedImage.images;
  if (!businessGUID || !newBusinessImages?.length) {
    console.error('Received invalid business images payload', newBusinessImagesOrEnhancedImage);
    return;
  }
  // Manually patch the cached business with the new logo image and image count
  const businessCacheID = apolloClient.cache.identify({
    __typename: 'BusinessRelayNode',
    guid: businessGUID,
  });

  const newLogoImage = newBusinessImages.find(
    (image) => image.imageType?.toLowerCase() === 'logo_image',
  );

  const businessModifiers: Modifiers = {
    logoImage: (cachedLogoImage) => {
      if (!newLogoImage) {
        return cachedLogoImage;
      }

      const logoImageWithTypename = {
        __typename: 'ImageLibraryImageNode' as const,
        ...newLogoImage,
      };

      const logoImageRef = apolloClient.cache.writeFragment({
        data: logoImageWithTypename,
        fragment: gql`
          fragment NewLogoImage on ImageLibraryImageNode {
            ${Object.keys(logoImageWithTypename).join(' ')}
          }
        `,
      });

      return logoImageRef;
    },
    totalImageCount: (cachedImageCount) => (cachedImageCount || 0) + newBusinessImages.length,
  };

  apolloClient.cache.modify({
    id: businessCacheID,
    fields: businessModifiers,
  });

  // Also manually patch the cached image library with the new images
  const imageLibraryWithTypeName = {
    ...newBusinessImages[0].imageLibrary,
    __typename: 'ImageLibraryNode' as const,
  };
  const imageLibraryCacheID = apolloClient.cache.identify(imageLibraryWithTypeName);

  const imageLibraryModifiers: Modifiers = {
    images: (cachedImages, { INVALIDATE, readField }) => {
      if (!cachedImages?.edges) {
        return INVALIDATE;
      }

      const updatedImageEdges = [...cachedImages.edges];

      for (const newImage of newBusinessImages) {
        const existingImageEdgeIndex = updatedImageEdges.findIndex(
          ({ node: nodeRef }) => readField('id', nodeRef) === newImage.id,
        );

        const newImageNodeWithTypeName: ImageLibraryImage = {
          ...newImage,
          __typename: 'ImageLibraryImageNode' as const,
        };

        const newImageRef = apolloClient.cache.writeFragment({
          fragment: gql`
            fragment NewImage on ImageLibraryImageNode {
              ${Object.keys(newImageNodeWithTypeName).join(' ')}
            }
          `,
          data: newImageNodeWithTypeName,
        });

        if (existingImageEdgeIndex > -1) {
          updatedImageEdges[existingImageEdgeIndex] = {
            ...updatedImageEdges[existingImageEdgeIndex],
            node: newImageRef,
          };
        } else {
          updatedImageEdges.push({
            __typename: 'ImageLibraryImageNodeEdge' as const,
            node: newImageRef,
          });
        }
      }

      // Re-sort by most recently updated
      updatedImageEdges.sort(
        (edgeA, edgeB) =>
          new Date(
            (readField('updatedAt', edgeA.node) as string | null | undefined) ?? 0,
          ).getTime() -
          new Date(
            (readField('updatedAt', edgeB.node) as string | null | undefined) ?? 0,
          ).getTime(),
      );

      return {
        ...cachedImages,
        edges: updatedImageEdges,
      };
    },
  };

  apolloClient.cache.modify({
    id: imageLibraryCacheID,
    fields: imageLibraryModifiers,
  });
};

/**
 * Updates the cached business and color library when new color fanout notifications are received
 */
const onReceivedBusinessColors = (businessColorsPayload: BusinessColorsCreatedPayload) => {
  const newBusinessColors = businessColorsPayload.colors;

  // Note that this is making the assumption that all colors are being added to the same color library;
  // this should be a safe assumption to make, but worth noting in case that does become a requirement
  // down the line
  const colorLibrary = newBusinessColors?.[0]?.colorLibrary;

  if (!colorLibrary) {
    console.error('Unable to get color library from received colors', newBusinessColors);
  }

  const colorLibraryWithTypename = {
    __typename: 'ColorLibraryNode' as const,
    ...colorLibrary,
  };

  // Patch the cached color library with the new colors
  const colorLibraryCacheID = apolloClient.cache.identify(colorLibraryWithTypename);

  const colorLibraryModifiers: Modifiers = {
    colors: (cachedColors, { readField, INVALIDATE }) => {
      if (!cachedColors?.edges) {
        return INVALIDATE;
      }

      const updatedColorEdges = [...cachedColors.edges];

      for (const newColor of newBusinessColors) {
        const { colorLibrary, ...newColorNode } = newColor;

        const existingImageEdgeIndex = updatedColorEdges.findIndex(
          ({ node: nodeRef }) => readField('id', nodeRef) === newColor.id,
        );

        const newColorWithTypename = {
          __typename: 'ColorLibraryColorNode' as const,
          ...newColorNode,
        };

        const newColorRef = apolloClient.cache.writeFragment({
          fragment: gql`
            fragment NewColor on ColorLibraryColorNode {
              ${Object.keys(newColorWithTypename).join(' ')}
            }
          `,
          data: newColorWithTypename,
        });

        if (existingImageEdgeIndex > -1) {
          updatedColorEdges[existingImageEdgeIndex] = {
            ...updatedColorEdges[existingImageEdgeIndex],
            node: newColorRef,
          };
        } else {
          updatedColorEdges.push({
            __typename: 'ColorLibraryColorNodeEdge' as const,
            node: newColorRef,
          });
        }
      }

      // Re-sort by most recently updated
      updatedColorEdges.sort(
        (edgeA, edgeB) =>
          new Date(
            (readField('updatedAt', edgeA.node) as string | null | undefined) ?? 0,
          ).getTime() -
          new Date(
            (readField('updatedAt', edgeB.node) as string | null | undefined) ?? 0,
          ).getTime(),
      );

      return {
        ...cachedColors,
        edges: updatedColorEdges,
      };
    },
  };

  apolloClient.cache.modify({
    id: colorLibraryCacheID,
    fields: colorLibraryModifiers,
  });
};

/**
 * Takes a business GUID and subscribes to all relevant fanout channels for keeping the cache up to date
 * as any changes to the business data roll in
 */
export const subscribeToBusinessCacheUpdates = (businessGUID: string) => {
  const cancelSubscriptionCallbacks = [
    SearchPushBindings.listenForBusinessDataUpdate(businessGUID, onReceivedBusinessDataUpdate),
    SearchPushBindings.listenForBusinessImages(businessGUID, onReceivedBusinessImages),
    SearchPushBindings.listenForBusinessColors(businessGUID, onReceivedBusinessColors),
  ];

  // Return a cleanup function that will cancel all subscriptions
  return () => {
    cancelSubscriptionCallbacks.forEach((cancelSubscription) => cancelSubscription());
  };
};
