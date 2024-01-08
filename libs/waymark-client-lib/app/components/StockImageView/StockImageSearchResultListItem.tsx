import { useMemo, useState } from 'react';

import { DownloadIcon } from 'app/icons/PresenceAndSharingIcons';
import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { ImageLibraryImage } from 'shared/api/graphql/imageLibraries/fragments';

import { Image } from 'libs/media-asset-management-ts';
import { RotatingLoader } from '@libs/shared-ui-components/src';
import { CheckMarkIcon } from 'app/icons/BasicIcons';

import * as styles from './StockImageSearchResultListItem.css';

interface StockImageSearchResultListItemProps {
  /** The image to display */
  image: Image;
  /** The image library to save image to */
  imageLibrary: AccountImageLibrary | BusinessImageLibrary;
  /** Callback to add the image to the user's library */
  onAddToLibrary?: (image: ImageLibraryImage) => void;
}

export default function StockImageSearchResultListItem({
  image,
  imageLibrary,
  onAddToLibrary,
}: StockImageSearchResultListItemProps) {
  const [isUploadingToLibrary, setIsUploadingToLibrary] = useState(false);

  // Check if the image is already in the library
  const isImageInLibrary = useMemo(() => {
    return imageLibrary.assets.some((asset) => asset.stockAssetID === image.sourceAssetID);
  }, [imageLibrary, image]);

  const canAddToLibrary = !isImageInLibrary && !isUploadingToLibrary;

  // Add the image to the library
  const handleAddToLibrary = async () => {
    if (!canAddToLibrary) {
      return;
    }

    try {
      setIsUploadingToLibrary(true);

      const createdImageLibraryImage = await imageLibrary.addStockImageToLibrary(image);
      if (createdImageLibraryImage) {
        onAddToLibrary?.(createdImageLibraryImage);
      }
    } catch (e) {
      console.error('Failed to add stock image to library', e);
    } finally {
      setIsUploadingToLibrary(false);
    }
  };

  let overlayContents: React.ReactNode | null = null;

  if (canAddToLibrary) {
    overlayContents = (
      <div className={styles.DownloadButton}>
        <DownloadIcon />
      </div>
    );
  } else if (isUploadingToLibrary) {
    overlayContents = <RotatingLoader strokeWidth={6} className={styles.RotatingLoaderIcon} />;
  } else {
    overlayContents = <CheckMarkIcon className={styles.InUseCheckMark} />;
  }

  return (
    <li className={styles.ListItem}>
      <WaymarkButton
        onClick={() => handleAddToLibrary()}
        hasFill={false}
        className={styles.ImageButton}
        isDisabled={!canAddToLibrary}
      >
        <div
          className={styles.SearchResultImageOverlay}
          {...styles.dataIsUploading(isUploadingToLibrary)}
          {...styles.dataIsInLibrary(isImageInLibrary)}
        >
          {overlayContents}
        </div>
        <img
          className={styles.SearchResultImage}
          src={image.thumbURL ?? undefined}
          alt={image.description}
          width={image.width}
          height={image.height}
        />
      </WaymarkButton>
    </li>
  );
}
