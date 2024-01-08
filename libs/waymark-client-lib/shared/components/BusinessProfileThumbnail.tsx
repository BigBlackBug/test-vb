// Vendor
import { css, cx as emotionClassNames } from '@emotion/css';

// Shared
import { DynamicBackgroundProgressiveImage } from 'shared/components/DynamicBackgroundProgressiveImage';

// App
import { NoLogoIcon } from 'app/icons/MediaIcons';

// Styles
import { themeVars } from '@libs/shared-ui-styles';

interface BusinessProfileThumbnailProps {
  /**
   * URL for the logo image to display
   */
  logoImageURL?: string | null;
  /**
   * The business' name which we'll use to display a placeholder letter
   * if we don't have a logo image
   */
  businessName?: string;
  /**
   * Whether the thumbnail should have a highlighted blue border
   */
  isHighlighted?: boolean;
  /**
   * Whether the logo image should expand to cover the entire thumbnail
   */
  shouldImageCoverContainer?: boolean;
  /**
   * Class name to apply any additional custom styles to the thumbnail
   */
  className?: string;
}

/**
 * Renders a thumbnail circle with either a business' logo image or the first
 * letter from their business name as a fallback
 */
export default function BusinessProfileThumbnail({
  logoImageURL = null,
  businessName = '',
  isHighlighted = false,
  shouldImageCoverContainer = false,
  className = undefined,
}: BusinessProfileThumbnailProps) {
  return (
    <div
      className={emotionClassNames(
        css`
          /* Circle which displays either the business' logo image or a placeholder image */
          width: 44px;
          height: 44px;
          position: relative;
          background-color: ${themeVars.color.light.solid};
          border: 1px solid ${themeVars.color.shadow._36};
          border-radius: 8px;
          overflow: hidden;
          transform: translate3d(0, 0, 0);
          line-height: 0;

          &[data-is-highlighted] {
            border-color: ${themeVars.color.brand.default};
          }

          &[data-no-logo] {
            background-color: ${themeVars.color.light._08};
          }
        `,
        className,
      )}
      data-is-highlighted={isHighlighted || null}
      data-no-logo={!logoImageURL || null}
    >
      {logoImageURL ? (
        <DynamicBackgroundProgressiveImage
          src={logoImageURL}
          alt={`${businessName} logo`}
          shouldCoverContainer={shouldImageCoverContainer}
        />
      ) : (
        // If we don't have a logo image, show a placeholder image
        <div
          className={css`
            color: ${themeVars.color.shadow._72};

            &[data-is-highlighted] {
              color: ${themeVars.color.brand.default};
            }

            svg {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              stroke-width: 0.7;
            }
          `}
          data-is-highlighted={isHighlighted || null}
        >
          <NoLogoIcon />
        </div>
      )}
    </div>
  );
}
