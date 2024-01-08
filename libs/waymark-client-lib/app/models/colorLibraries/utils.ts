import Color from './Color';
import { ColorLibraryColorNode, ColorLibraryNode } from './queries';
import { FormattedColorLibraryData } from './types';

/**
 * Takes a color library color node returned from the graphql API and formats it as a Color instance
 * which can be stored in a ColorLibrary's assets array
 *
 * @param {Object}  colorLibraryColorNode
 */
export const getColorDataFromNode = ({
  hexCode,
  displayName,
  order,
  updatedAt,
}: ColorLibraryColorNode) =>
  new Color({
    hexCode,
    displayName,
    order,
    updatedAt,
  });

/**
 * Takes a color library node returned from the graphql API and formats it into an object which can be safely passed to
 * a ColorLibrary constructor.
 *
 * @param {Object} colorLibraryNode
 */
export const getColorLibraryDataFromNode = (
  colorLibraryNode: ColorLibraryNode,
): FormattedColorLibraryData => {
  // Create an array of `Color` instances from the query data
  const colors = colorLibraryNode.colors?.edges.map(({ node }) => getColorDataFromNode(node)) ?? [];

  return {
    guid: colorLibraryNode.guid,
    displayName: colorLibraryNode.displayName,
    colors,
  };
};
