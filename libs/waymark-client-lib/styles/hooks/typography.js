// Vendor
import {
    useMemo
} from 'react';

// Local
import typographyStyles from 'styles/themes/waymark/typography';

/**
 * Hook returns the appropriate typography styles for the current app theme config
 *
 * @param {string[]} typographyNames    Array of names for typography styles that we want.
 * @returns {Array} Array of emotion styles for each provided typography name.
 *
 * @example
 * const [bodyTextStyle, buttonTextStyle] = useTypography(["body", "button"]);
 */
export const useTypography = (typographyNames) => {
    return useMemo(
        () =>
        typographyNames.map((name) => {
            const typographyStyle = typographyStyles[name];

            if (!typographyStyle) {
                console.error(`Could not find typography style with name "${name}"`);
            }

            return typographyStyle;
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        typographyNames,
    );
};