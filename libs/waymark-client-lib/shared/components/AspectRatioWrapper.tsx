// Vendor
import { useMemo } from 'react';

import { css, cx as emotionClassNames } from '@emotion/css';

// An aspect ratio must be in the format "{NUMBER}:{NUMBER}", ie "16:9"
const validateAspectRatioRegex = /([0-9])+:([0-9])+/;

interface AspectRatioWrapperProps {
  aspectRatio: string;
  className?: string | null;
  children?: React.ReactNode;
}

/**
 * Helper component renders a wrapper div with styling applied to achieve a desired aspect ratio
 *
 * @param {string}  aspectRatio   String representing the aspect ratio that our wrapper should have,
 *                                  in the format "width ratio:height ratio" (ie, 16:9 -> landscape, 1:1 -> square)
 * @param {string}  className     Optional class to apply additional custom styling to the wrapper
 */
export default function AspectRatioWrapper({
  aspectRatio,
  className = null,
  children = null,
}: AspectRatioWrapperProps) {
  // Parse the padding-top percentage number that we should use to achieve the provided aspect ratio
  const aspectRatioPaddingTop = useMemo(() => {
    // Validate that the aspect ratio string is formatted correctly
    if (!validateAspectRatioRegex.test(aspectRatio)) {
      console.error(
        `"${aspectRatio}" is not a valid aspect ratio for AspectRatioWrapper. Aspect ratios must be in format "width number:height number", ie "16:9"`,
      );
      return 0;
    }

    const [widthRatio, heightRatio] = aspectRatio.split(':');

    // Percent values provided to padding-top are relative to the parent element’s width,
    // which means we can use that to achieve an aspect ratio by calculating the percentage
    // that the height should be relative to the width (ie, 100% -> square, 56.25% -> landscape, 177% -> vertical)
    return 100 * (Number(heightRatio) / Number(widthRatio));
  }, [aspectRatio]);

  return (
    <div
      className={emotionClassNames(
        css`
          position: relative;
          padding-top: ${aspectRatioPaddingTop}%;
        `,
        className,
      )}
    >
      {children}
    </div>
  );
}
