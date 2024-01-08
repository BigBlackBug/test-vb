// Vendor
import EditorCollapsibleLibrarySection from 'editor/components/EditorCollapsibleLibrarySection.js';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { DynamicBackgroundProgressiveImage } from 'shared/components/DynamicBackgroundProgressiveImage';

import * as styles from './RemovedAssetLibrarySection.css';

interface RemovedAssetThumbnailButtonProps {
  /* Restore asset to user library */
  restoreAsset: () => Promise<void>;
  /* Thumbnail that represents library asset */
  thumbnailImageURL?: string | null;
  /* URL used to track asset */
  trackingURL?: string | null;
}

/**
 * Button represents an image or video asset that was removed from a user's library.
 * Clicking button restores asset to user's library.
 */
const RemovedAssetThumbnailButton = ({
  restoreAsset,
  thumbnailImageURL,
  trackingURL = null,
}: RemovedAssetThumbnailButtonProps) =>
  thumbnailImageURL ? (
    <div className={styles.ImageContainer}>
      <div className={styles.LibraryImageControlsOverlay}>
        <WaymarkButton
          colorTheme="Primary"
          isSmall
          className={styles.ImageControlsButton}
          onClick={restoreAsset}
        >
          Restore
        </WaymarkButton>
      </div>

      <DynamicBackgroundProgressiveImage
        src={thumbnailImageURL}
        alt="Library image"
        className={styles.LibraryImage}
        imageWrapperClassName={styles.LibraryImageWrapper}
      />
      {/* If this item has a tracking url, render a hidden image element which will send a request to it */}
      {trackingURL ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={trackingURL} style={{ display: 'none' }} />
      ) : null}
    </div>
  ) : null;

interface RemovedAssetLibrarySectionProps {
  /* Library display name */
  displayName: string | null;
  /* Assets belonging to library */
  assets: Array<{
    guid: string;
    imageURL?: string;
    thumbnailImageURL?: string;
    trackingURL?: string;
  }>;
  /* Whether or not the library section should be toggled open when the component mounts */
  isInitiallyExpanded: boolean;
  /* Function to call with an asset to restore it to its library */
  restoreAsset: (asset: Record<string, unknown>) => Promise<void>;
}

/**
 * Displays a removed library section, optionally wrapped in a collapsible section
 */
function RemovedAssetLibrarySection({
  displayName = null,
  assets,
  isInitiallyExpanded,
  restoreAsset,
}: RemovedAssetLibrarySectionProps) {
  return (
    <EditorCollapsibleLibrarySection
      primaryText={displayName}
      isInitiallyExpanded={isInitiallyExpanded}
    >
      <div className={styles.AssetGrid}>
        {assets.map((asset) => (
          <RemovedAssetThumbnailButton
            key={asset.guid}
            /* For images, we want to display their source URL, but the thumbnail URL for footage */
            thumbnailImageURL={asset.imageURL || asset.thumbnailImageURL}
            restoreAsset={() => restoreAsset(asset)}
            trackingURL={asset.trackingURL}
          />
        ))}
      </div>
    </EditorCollapsibleLibrarySection>
  );
}

export default RemovedAssetLibrarySection;
