// Vendor
import _ from 'lodash';

import { BFSFontVariant } from 'libs/shared-types';
import { getClosestFontVariant } from 'libs/util-fonts';

export default class Font {
  guid: string;
  order: number;
  updatedAt: Date | null;
  bfsUUID: string;
  fontFamily: string;
  displayName: string;
  variants: Array<BFSFontVariant>;
  defaultFontVariant: BFSFontVariant;

  constructor({
    guid,
    order,
    updatedAt,
    bfsUUID,
    fontFamily,
    displayName = Font.getFontDisplayName(fontFamily),
    variants = [],
  }: {
    guid: string;
    order: number;
    updatedAt: Date | null;
    bfsUUID: string;
    fontFamily: string;
    displayName?: string;
    variants?: Array<BFSFontVariant>;
  }) {
    this.guid = guid;
    this.order = order;
    this.updatedAt = updatedAt;

    this.bfsUUID = bfsUUID;
    this.fontFamily = fontFamily;
    this.displayName = displayName;

    this.variants = variants;
    this.defaultFontVariant = getClosestFontVariant(variants);
  }

  /**
   * Strips font family names of any possible non-display characters.
   * @param  {string} fontFamily  Font family name in various forms.
   * @return {string}             Display version of font family name.
   *
   * 'WaymarkVideo__PTSans' --> 'PT Sans'
   * 'AveriaLibre' --> 'Averia Libre'
   */
  static getFontDisplayName(fontFamily: string) {
    return _.startCase(fontFamily.replace('WaymarkVideo__', ''));
  }

  /**
   * Takes a desired font weight and whether we want italics and
   * returns this font's variant which most closely matches that criteria
   *
   * @param {number}  desiredFontWeight   The target font weight of the variant that we're looking for, ie 400
   * @param {boolean} [isItalic=false]    Whether the variant should be styled as italic
   */
  getClosestVariant(targetFontVariantConfig: { weight?: number; isItalic?: boolean } = {}) {
    return getClosestFontVariant(this.variants, targetFontVariantConfig);
  }

  /**
   * Gets one of this font's variants by UUID
   *
   * @param {string} variantUUID
   */
  getVariantByUUID(variantUUID: string) {
    return this.variants.find(({ uuid }) => uuid === variantUUID);
  }

  toString() {
    return `${this.fontFamily} (${this.guid})`;
  }
}
