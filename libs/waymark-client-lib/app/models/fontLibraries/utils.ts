import Font from './Font';
import { FontLibraryFontNode, FontLibraryNode } from './queries';

/**
 * Takes a font library font node returned from the graphql API and formats it as a Font asset instance
 * which can be stored in a FontLibrary's assets array
 *
 * @param {Object} fontLibraryFontNode
 */
export const getFontDataFromNode = ({
  guid,
  displayName,
  font: { bfsUuid: bfsUUID, fontFamilyName, variants },
  order,
  updatedAt,
}: FontLibraryFontNode) =>
  new Font({
    guid,
    displayName: displayName || undefined,
    bfsUUID,
    fontFamily: fontFamilyName,
    variants,
    order,
    updatedAt: updatedAt ? new Date(updatedAt) : null,
  });

export interface FormattedFontLibraryData {
  displayName: string | null;
  guid: string | null;
  fonts: Font[];
}

/**
 * Takes a font library node returned from the graphql API and formats it into an object which can be safely passed to
 * a FontLibrary constructor.
 *
 * @param {Object} fontLibraryNode
 */
export const getFontLibraryDataFromNode = (
  fontLibraryNode: FontLibraryNode,
): FormattedFontLibraryData => {
  const fonts =
    fontLibraryNode.fonts?.edges.map(({ node: fontNode }) => getFontDataFromNode(fontNode)) ?? [];

  return {
    displayName: fontLibraryNode.displayName,
    guid: fontLibraryNode.guid,
    fonts,
  };
};
