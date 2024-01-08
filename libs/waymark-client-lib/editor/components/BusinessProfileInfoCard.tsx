// Vendor
import _ from 'lodash';
import { useMemo } from 'react';
import Dotdotdot from 'react-dotdotdot';
import classNames from 'classnames';

// Shared UI
import { DotLoader } from '@libs/shared-ui-components';

// Shared
import BusinessProfileThumbnail from 'shared/components/BusinessProfileThumbnail';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

// App
import { ColorPaletteIcon, MediaPhotoIcon } from 'app/icons/MediaIcons';
import { AlertIcon } from 'app/icons/BasicIcons';

// Styles
import * as styles from './BusinessProfileInfoCard.css';

interface MediaLibraryIndicatorProps {
  iconComponent: React.ComponentType<{ color: string; className: string; title: string }>;
  title: string;
  assetPreviewContent: React.ReactNode | string | number;
}

/**
 * Renders an icon + number representing the number of a type of asset in the business' library
 *
 * @param {func}  iconComponent   React component which renders an SVG icon representing the media library
 * @param {string}  title         Title to apply to the icon for accessibility
 * @param {number}  assetCount    Number of assets in this media library
 */
function MediaLibraryIndicator({
  iconComponent: Icon,
  title,
  assetPreviewContent,
}: MediaLibraryIndicatorProps) {
  return (
    <figure className={styles.mediaLibraryIndicator}>
      <Icon color="currentColor" className={styles.mediaLibraryIndicatorIcon} title={title} />
      <figcaption className={styles.mediaLibraryIndicatorCaption}>{assetPreviewContent}</figcaption>
    </figure>
  );
}

interface BusinessProfileListItemMediaLibraryIndicatorsProps {
  imageCount: number;
  colors: string[];
}

/**
 * Renders icons indicating the number of image and footage assets in the business' library
 *
 * @param {number}  imageCount    Number of images in the business' library
 * @param {number}  footageCount  Number of videos in the business' library
 */
function BusinessProfileListItemMediaLibraryIndicators({
  imageCount,
  colors,
}: BusinessProfileListItemMediaLibraryIndicatorsProps) {
  // We'll only display up to the first 4 colors
  const displayColors = useMemo(() => colors.slice(0, 4), [colors]);

  return (
    <div className={styles.mediaLibraryIndicatorList}>
      <MediaLibraryIndicator
        iconComponent={MediaPhotoIcon}
        title="Brand images"
        assetPreviewContent={imageCount}
      />
      <MediaLibraryIndicator
        iconComponent={ColorPaletteIcon}
        title="Brand colors"
        assetPreviewContent={
          _.isEmpty(colors) ? (
            0
          ) : (
            <div className={styles.brandColorList}>
              {displayColors.map((colorHexCode) => (
                <div
                  key={colorHexCode}
                  style={{
                    backgroundColor: colorHexCode,
                  }}
                  className={styles.brandColorDot}
                />
              ))}
              {/* If we couldn't display all of the colors, add a +X indicator to show how many were cut off */}
              {displayColors.length < colors.length ? (
                <span className={styles.truncatedBrandColorCount}>
                  +{colors.length - displayColors.length}
                </span>
              ) : null}
            </div>
          )
        }
      />
    </div>
  );
}

interface BusinessProfileInfoCardProps {
  businessDetails?: CoreBusinessDetails | null;
  isLoading?: boolean;
  isHighlighted?: boolean;
  thumbnailClassName?: string | null;
  infoContainerClassName?: string | null;
  onClick?: (() => void) | null;
  className?: string | null;
  additionalCardContent?: React.ReactNode | null;
  isMissingBusinessInfo?: boolean;
}

/**
 * Renders a small visual summary of a business, including a thumbnail, the business name, and
 * some indicators for the number of assets in the business' library.
 *
 * @param {Object}  businessDetails   Object describing data about the business to display, returned from our GQL API
 * @param {boolean} isLoading         Whether the data is loading and we should show a loading state in the card
 * @param {boolean} isHighlighted     Whether the card should apply "highlighted" styles
 * @param {string}  [thumbnailClassName] Optional class name to apply to the thumbnail
 * @param {string}  [infoContainerClassName] Optional class name to apply to the div which contains all of the business' info (ie, name + asset counts)
 * @param {string}  [className] Option class nanme to apply to the container / wrapper div
 * @param {React.ReactNode} [additionalCardContent] Optional additional content to render in the card
 * @param {boolean} [isMissingBusinessInfo] Whether the business info is missing any essential fields
 */
export default function BusinessProfileInfoCard({
  businessDetails = null,
  isLoading = false,
  isHighlighted = false,
  thumbnailClassName = null,
  infoContainerClassName = null,
  className = null,
  additionalCardContent = null,
  isMissingBusinessInfo = false,
  onClick,
}: BusinessProfileInfoCardProps) {
  const { businessName, logoImage, totalImageCount = 0, colorLibraries } = businessDetails || {};

  const logoImageUrl = logoImage?.upscaledImageUrl
    ? logoImage?.upscaledImageUrl
    : logoImage?.baseUrl;

  const brandColors: string[] = useMemo(
    () => colorLibraries?.edges[0]?.node.colors.edges.map(({ node: { hexCode } }) => hexCode) ?? [],
    [colorLibraries],
  );

  const cardContents = (
    <>
      {/* Left portion of the contents is the thumbnail image/letter */}
      <BusinessProfileThumbnail
        businessName={businessName}
        logoImageURL={logoImageUrl}
        className={classNames(styles.thumbnail, thumbnailClassName)}
        isHighlighted={isHighlighted}
      />

      <div className={classNames(styles.brandInfoContainer, infoContainerClassName)}>
        {isLoading ? (
          // If the business info is loading, show a dot loader in the place of the business name
          <DotLoader className={styles.brandInfoDotLoader} />
        ) : (
          <>
            {isMissingBusinessInfo && (
              <div className={styles.missingBusinessInfoContainer}>
                <span>
                  <AlertIcon width="12px" height="12px" />
                </span>
                <span className={styles.missingBusinessInfo}>Missing brand info</span>
              </div>
            )}
            {/* Use Dotdotdot to clamp business names to 1 line */}
            <Dotdotdot clamp={1} tagName="p" className={styles.businessNameDisplay}>
              <span title={businessName || undefined}>{businessName || 'No business name'}</span>
            </Dotdotdot>
          </>
        )}

        <BusinessProfileListItemMediaLibraryIndicators
          imageCount={totalImageCount || 0}
          colors={brandColors}
        />
      </div>
      {additionalCardContent}
    </>
  );

  return onClick ? (
    <WaymarkButton
      hasFill={false}
      isSmall
      isUppercase={false}
      onClick={onClick}
      className={classNames(styles.businessProfileInfoCard, className)}
      {...styles.dataIsMissingBusinessInfo(isMissingBusinessInfo)}
      {...styles.dataIsHighlighted(isHighlighted)}
    >
      {cardContents}
    </WaymarkButton>
  ) : (
    <div
      className={classNames(styles.businessProfileInfoCard, className)}
      {...styles.dataIsMissingBusinessInfo(isMissingBusinessInfo)}
      {...styles.dataIsHighlighted(isHighlighted)}
    >
      {cardContents}
    </div>
  );
}
