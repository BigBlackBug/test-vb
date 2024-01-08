/* eslint-disable import/prefer-default-export */
/* eslint-disable max-classes-per-file */
// Vendor
import _ from 'lodash';
import {
    useCallback
} from 'react';
import tinycolor from 'tinycolor2';

// Editor
import {
    useEditorState,
    useEditorDispatch
} from 'editor/providers/EditorStateProvider.js';
import {
    useEditorFieldsOfType
} from 'editor/providers/EditorFormDescriptionProvider.js';
import {
    VideoEditingFieldTypes
} from 'editor/constants/Editor';

// Shared
import {
    apolloClient
} from 'shared/api/graphql';
import {
    getDeltaEForHexColors
} from 'shared/utils/colors.js';

// WAYMARK APP DEPENDENCIES
import {
    businessColorLibrariesQuery
} from 'app/models/colorLibraries/queries';

const MONOCHROMATIC_ALTERNATIVE_COLOR_COUNT = 4;

// Thresholds for the highest contrast ratio which we will allow between an original template color and the color we're replacing it with in personalization
// We have a looser threshold for brand colors from the user's library because we want to try to get as many of those in the template as possible,
// but if we don't have a good matching brand color and a generated alternate color fits within a stricter threshold, we'll use that
const BRAND_COLOR_CONTRAST_RATIO_THRESHOLD = 3;
const ALTERNATIVE_COLOR_CONTRAST_RATIO_THRESHOLD = 2;

// Threshold for the lowest Delta E value between two colors under which we would consider
// them to be too similar to use both in personalization
const DUPLICATE_COLOR_DELTA_E_THRESHOLD = 2;

/**
 * A color which can be considered as an option in color personalization
 *
 * @property {string} hex             The hex code of the color
 * @property {boolean} isBrandColor   Whether the color is an original brand color as opposed to a generated alternate color,
 *                                      meaning it should receive higher priority in personalization
 * @property {boolean} isGrayscale    Whether the color is grayscale, meaning it should receive lower priority in personalization
 */
class PersonalizationColor {
    constructor(hex, isBrandColor = false) {
        this.isBrandColor = isBrandColor;

        this.parsedColor = tinycolor(hex);
        // Make sure the hex code is standardized as all-caps so we can reliably compare it against other hex codes
        this.hex = this.parsedColor.toHexString().toUpperCase();
        this.isGrayscale = this.parsedColor.toHsl().s === 0;
    }

    /**
     * Get a list of monochromatic alternate colors related to this color
     *
     * @return {PersonalizationColor[]}
     */
    getAlternatePersonalizationColors() {
        return (
            this.parsedColor
            // `tinycolor.monochromatic` takes the number of colors to generate as an argument, but one of those colors will just be the original
            // so we want to add 1 extra and slice off the first returned color to account for that
            .monochromatic(MONOCHROMATIC_ALTERNATIVE_COLOR_COUNT + 1)
            .slice(1)
            .map((alternativeColor) => new PersonalizationColor(alternativeColor.toHexString(), false))
        );
    }
}

/**
 * A match candidate for a template color with the personalization color and
 * the colors' contrast ratio which represents the strength of the match.
 */
class PersonalizationColorMatchCandidate {
    constructor(personalizationColor, contrastRatio) {
        this.isBrandColor = personalizationColor.isBrandColor;
        this.isGrayscale = personalizationColor.isGrayscale;
        this.hex = personalizationColor.hex;
        this.contrastRatio = contrastRatio;
    }
}

/*
 * A unique color in the template which we'll try to apply a personalization color to
 * This can represent more than one color field if they have the same color in the default configuration.
 */
class TemplateColor {
    constructor(hexCode, paths, availablePersonalizationColors) {
        // Make sure to clone the paths array so we don't modify the original
        this.configurationPaths = [...paths];

        this.parsedColor = tinycolor(hexCode);
        // Make sure the hex code is standardized as all-caps so we can reliably compare it against other hex codes
        this.hex = this.parsedColor.toHexString().toUpperCase();
        this.isGrayscale = this.parsedColor.toHsl().s === 0;

        this.personalizationColorMatchCandidates = this.getPersonalizationColorMatchCandidates(
            availablePersonalizationColors,
        );

        // The final selected personalization color which will be applied to the configuration for this template color
        this.appliedPersonalizationHexColor = null;
    }

    /**
     * Get a fallback grayscale version of this template color's original color
     * if we couldn't find a good personalization match
     */
    getGrayscaleFallbackHexColor() {
        return this.parsedColor.greyscale().toHexString().toUpperCase();
    }

    /**
     * Takes a list of available personalization colors and returns a list of candidates which match this
     * template color best. These results will also be stored on the personalizationColorMatchCandidates property.
     *
     * @param {PersonalizationColor[]} availablePersonalizationColors
     *
     * @returns {PersonalizationColorMatchCandidate[]} A list of candidates which match this template color best
     */
    getPersonalizationColorMatchCandidates(availablePersonalizationColors) {
        if (availablePersonalizationColors.length === 0) return [];

        // If the color is grayscale, just use the default template color rather than trying to change it.
        // We're doing this based on the assumption that grayscale colors are usually text so we don't want to
        // touch them.
        if (this.isGrayscale) {
            return [];
        }

        // Maintain a list of all brand colors which have an acceptable enough match to
        // be used for the template color
        const colorMatchCandidates = [];

        availablePersonalizationColors.forEach((personalizationColor) => {
            // Calculate the readability contrast ratio between the template color and the personalization color;
            // normally you would be looking for a high ratio to indicate that if these colors were combined
            // as a text and background color they would be readable together, but for this task
            // we want to try to insert colors in the template while retaining the existing readability as well as possible,
            // so we should prioritize the lowest contrast ratio we can find when choosing a color to apply to a template color
            const contrastRatio = tinycolor.readability(personalizationColor.hex, this.hex);

            if (
                // Use a different lower threshold for brand colors from the user's library
                // because we want to try to get as many of those in the template as possible,
                (personalizationColor.isBrandColor &&
                    contrastRatio <= BRAND_COLOR_CONTRAST_RATIO_THRESHOLD) ||
                contrastRatio <= ALTERNATIVE_COLOR_CONTRAST_RATIO_THRESHOLD
            ) {
                colorMatchCandidates.push(
                    new PersonalizationColorMatchCandidate(personalizationColor, contrastRatio),
                );
            }
        });

        // Sort the candidates by match quality
        return colorMatchCandidates.sort((candidate1, candidate2) => {
            // Sort original brand colors before generated alternates
            if (candidate1.isBrandColor !== candidate2.isBrandColor) {
                return candidate1.isBrandColor ? -1 : 1;
            }

            // Sort non-grayscale colors before grayscale ones
            if (candidate1.isGrayscale !== candidate2.isGrayscale) {
                return candidate1.isGrayscale ? 1 : -1;
            }

            // If all else is the same, sort by contrast ratio,
            // prioritizing the color with the lowest contrast ratio
            return candidate1.contrastRatio - candidate2.contrastRatio;
        });
    }
}

/**
 * Takes a business GUID, fetches that business' color libraries, and returns an array of colors that can
 * be used for personalization, including some additional generated alternate colors.
 *
 * @param {string} businessGUID
 *
 * @returns {PersonalizationColor[]}  Array of colors that can be used for personalization for the given business
 */
async function getPersonalizationColorsForBusiness(businessGUID) {
    // The color library from the useEditorMediaLibraries hook may not be available or match the
    // business that the video is being personalized for, so we need to query for the color library
    // at runtime to be safe (thanks to Apollo's caching, this shouldn't be an overly expensive process)
    const brandColorLibrariesResponse = businessGUID ?
        await apolloClient.query({
            query: businessColorLibrariesQuery,
            variables: {
                businessGUID,
            },
        }) :
        null;

    // Get an array of PersonalizationColors for all of the brand's library colors
    const originalBrandPersonalizationColors =
        brandColorLibrariesResponse ? .data.businessByGuid.colorLibraries.edges.flatMap(
            ({
                node: colorLibrary
            }) =>
            colorLibrary.colors.edges.map(
                ({
                    node: color
                }) => new PersonalizationColor(color.hexCode, true),
            ),
        );

    const availablePersonalizationColors = [];

    // Generate some additional alternate shades off of any available non-grayscale brand colors just to give us more
    // options to work with
    originalBrandPersonalizationColors.forEach((brandPersonalizationColor) => {
        // We can start knowing we want to use all of the brand colors in personalization, but we also want to
        // generate some additional alternates to try and ensure we get as many colors in the video as possible
        availablePersonalizationColors.push(brandPersonalizationColor);

        // If the brand color is grayscale, we don't want to generate any additional alternates
        if (brandPersonalizationColor.isGrayscale) return;

        // Get some alternate PersonalizationColors and add them to our list of all available personalization colors, skipping any which
        // overlap by being too similar to any existing personalization colors.
        brandPersonalizationColor
            .getAlternatePersonalizationColors()
            .forEach((alternatePersonalizationColor) => {
                const existingSimilarPersonalizationColor = availablePersonalizationColors.find(
                    (personalizationColor) => {
                        // Get the distance between the new alternate color and the existing personalization color; if they're too similar, we'll
                        // consider it a match
                        const colorDistance = getDeltaEForHexColors(
                            personalizationColor.hex,
                            alternatePersonalizationColor.hex,
                        );

                        return colorDistance < DUPLICATE_COLOR_DELTA_E_THRESHOLD;
                    },
                );

                // If we found an existing personalization color that was too similar to the alternate color,
                // we'll skip it, but otherwise add it to the list of available personalization colors
                if (!existingSimilarPersonalizationColor) {
                    availablePersonalizationColors.push(alternatePersonalizationColor);
                }
            });
    });

    return availablePersonalizationColors;
}

/**
 * Takes a list of template color fields and then goees through available personalization colors
 * and maps the best matching color to each field
 *
 * @param {Object[]} templateColors
 */
const mapPersonalizedColorsToTemplateColors = (templateColors) => {
    // Gather all template color fields along with all potential personalization colors
    // that could be mapped to them
    const unmappedTemplateColorFields = [...templateColors];

    // Go through each template color field's match candidates and ensure each field gets the
    // absolute best possible match. This is constructed to ideally maximize as many fields getting colors
    // as possible while also avoiding any fields receiving duplicate colors.
    // We'll keep looping until every color field in the video has had a personalized color mapped to it
    while (unmappedTemplateColorFields.length > 0) {
        // Keep track of the index of the field with the current strongest matching color so we can remove that
        // from the list of unmapped fields when we're done (if we don't find a better one, we'll just take the first one)
        let templateColorWithStrongestMatchingColorIndex = 0;

        for (let i = 1; i < unmappedTemplateColorFields.length; i += 1) {
            const templateColor = unmappedTemplateColorFields[i];
            const matchCandidate = templateColor.personalizationColorMatchCandidates[0];

            const templateColorWithStrongestMatchingColor =
                unmappedTemplateColorFields[templateColorWithStrongestMatchingColorIndex];
            const currentStrongestMatchCandidate =
                templateColorWithStrongestMatchingColor.personalizationColorMatchCandidates[0];

            if (
                // If the current selected template color field doesn't have any color matches, prefer the other field
                !currentStrongestMatchCandidate ||
                // If the other template color field's best color match candidate is a stronger match, prefer that one
                (matchCandidate &&
                    matchCandidate.contrastRatio < currentStrongestMatchCandidate.contrastRatio) ||
                // If the other field only has one good match left and the current selected field has multiple matches,
                // let's prioritize making sure the field with one match gets to use it first
                (templateColor.personalizationColorMatchCandidates.length === 1 &&
                    templateColorWithStrongestMatchingColor.personalizationColorMatchCandidates.length > 1)
            ) {
                templateColorWithStrongestMatchingColorIndex = i;
            }
        }

        // Remove the selected field from the list of unmapped template colors because it's about to be successfully mapped
        const [templateColorToMap] = unmappedTemplateColorFields.splice(
            templateColorWithStrongestMatchingColorIndex,
            1,
        );

        // Get the strongest color match candidate for the field which we're going to map
        templateColorToMap.appliedPersonalizationHexColor =
            templateColorToMap.personalizationColorMatchCandidates[0] ? .hex ? ?
            // Fall back to a grayscale version of the template color if we don't have a match
            templateColorToMap.getGrayscaleFallbackHexColor();

        // Remove the color we just used from contention for any remaining unmapped template colors
        unmappedTemplateColorFields.forEach((templateColor) => {
            // eslint-disable-next-line no-param-reassign
            templateColor.personalizationColorMatchCandidates =
                templateColor.personalizationColorMatchCandidates.filter(
                    ({
                        hex
                    }) => hex !== templateColorToMap.appliedPersonalizationHexColor,
                );
        });
    }
};

/**
 * Hook returns a function which takes a business GUID
 * and then personalizes the video's color fields with that business'
 * color libraries.
 */
export function useApplyBrandColorsToConfiguration() {
    const {
        defaultConfiguration
    } = useEditorState();
    const {
        setFullConfiguration
    } = useEditorDispatch();

    const colorFields = useEditorFieldsOfType(VideoEditingFieldTypes.color);

    /**
     * Takes a business GUID and updates the video's configuration with personalized colors from the business' color libraries
     * applied. If the business has no colors, the video's color fields will be left as-is.
     *
     * @param {string} businessGUID
     */
    return useCallback(
        async (businessGUID) => {
            const availablePersonalizationColors = await getPersonalizationColorsForBusiness(
                businessGUID,
            );

            // Gather all unique colors in the template's default configuration
            // and the paths that correspond to them. This means that if two fields have the same color,
            // we'll preserve that relationship by setting the same new personalized color on both.
            const uniqueEditableTemplateColors = {};
            colorFields.forEach((field) => {
                const templateColorHexCode = _.get(defaultConfiguration, field.paths[0]).toUpperCase();

                if (uniqueEditableTemplateColors[templateColorHexCode]) {
                    // If we already have a template color for this field's color, add its configuration paths to the
                    // existing TemplateColor's paths
                    uniqueEditableTemplateColors[templateColorHexCode].configurationPaths.push(
                        ...field.paths,
                    );
                } else {
                    uniqueEditableTemplateColors[templateColorHexCode] = new TemplateColor(
                        templateColorHexCode,
                        field.paths,
                        availablePersonalizationColors,
                    );
                }
            });

            const templateColors = Object.values(uniqueEditableTemplateColors);

            if (availablePersonalizationColors.length !== 0) {
                // Perform a final pass to map the best personalization color to each template color
                mapPersonalizedColorsToTemplateColors(templateColors);
            }

            // We'll hang onto the updated configuration outside of the setFullConfiguration callback so we can return the newly
            // updated configuration
            let newConfiguration;

            setFullConfiguration((currentConfiguration) => {
                newConfiguration = _.cloneDeep(currentConfiguration);

                // Update the configuration with our color mappings
                templateColors.forEach(({
                    configurationPaths,
                    appliedPersonalizationHexColor
                }) => {
                    if (appliedPersonalizationHexColor) {
                        configurationPaths.forEach((path) => {
                            _.set(newConfiguration, path, appliedPersonalizationHexColor);
                        });
                    }
                });

                return newConfiguration;
            });

            return newConfiguration;
        }, [colorFields, defaultConfiguration, setFullConfiguration],
    );
}