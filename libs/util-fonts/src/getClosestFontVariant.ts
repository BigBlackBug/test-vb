import { BFSFontVariant } from 'libs/shared-types';

const DEFAULT_FONT_WEIGHT = 400;

/**
 * Takes a list of font variants and returns the variant which most closely matches
 * the provided target font weight and/or style.
 *
 * @param {BFSFontVariant[]}  fontVariants - List of font variants to choose from.j
 * @param {Object}  targetFontVariantConfig - Config object with the target font weight and style which we
 *                                            want to find a match for.
 * @param {number}  [targetFontVariantConfig.weight=400] - The target font weight of the variant that we're looking for.
 *                                                                    Defaults to 400 if not provided.
 * @param {boolean} [isItalic=false] - Whether the variant should be styled as italic. Defaults to false if not provided.
 */
export function getClosestFontVariant(
  fontVariants: Array<BFSFontVariant>,
  targetFontVariantConfig: {
    weight?: number;
    isItalic?: boolean;
  } = {},
): BFSFontVariant {
  const { weight: desiredFontWeight = DEFAULT_FONT_WEIGHT, isItalic = false } =
    targetFontVariantConfig;

  let [currentClosestVariant] = fontVariants;

  for (let i = 1, numVariants = fontVariants.length; i < numVariants; i += 1) {
    const variant = fontVariants[i];

    const currentClosestFontWeightDistance = Math.abs(
      currentClosestVariant.weightIndex - desiredFontWeight,
    );
    const newFontWeightDistance = Math.abs(variant.weightIndex - desiredFontWeight);

    // If this variant matches the desired font style and the current closest doesn't,
    // we should use this one instead.
    const variantHasBetterFittingStyle =
      currentClosestVariant.isItalic !== isItalic && variant.isItalic === isItalic;

    // If the desired weight is heavier than the default and therefore is on the bolder side,
    // we should prioritize the heavier variant; otherwise, prioritize the lighter variant.
    const variantHasBetterLeaningWeight =
      desiredFontWeight > DEFAULT_FONT_WEIGHT
        ? variant.weightIndex > currentClosestVariant.weightIndex
        : variant.weightIndex < currentClosestVariant.weightIndex;

    const variantHasBetterFittingWeight =
      // If this variant's font weight is closer to the desired weight than the current closest,
      // we should use this one instead
      newFontWeightDistance < currentClosestFontWeightDistance ||
      // If both variants are equally close to the desired font weight, we'll determine which
      // one we should pick based on if the desired font weight is lighter or bolder than the
      // default weight.
      (newFontWeightDistance === currentClosestFontWeightDistance && variantHasBetterLeaningWeight);

    if (
      variantHasBetterFittingStyle ||
      // If this variant's style matches the current closest, use it if it has a better fitting weight
      (variant.isItalic === currentClosestVariant.isItalic && variantHasBetterFittingWeight)
    ) {
      currentClosestVariant = variant;
    }
  }

  return currentClosestVariant;
}
