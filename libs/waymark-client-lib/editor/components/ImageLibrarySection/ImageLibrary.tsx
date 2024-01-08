// Vendor
import { useMemo, useState, useEffect } from 'react';

// Editor
import EditorFileUploadButton from 'editor/components/EditorFileUploadButton';
import EditorFileUploadPlaceholder from 'editor/components/EditorFileUploadPlaceholder';
import { maxSimultaneousUploadCount } from 'editor/constants/EditorImage';

// Shared
import SearchBar from 'shared/components/SearchBar';

// Waymark app dependencies
import BaseEditableImageLibrary from 'app/models/imageLibraries/BaseEditableImageLibrary';
import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import StaticImageLibrary from 'app/models/imageLibraries/StaticImageLibrary';
import ImageAsset from 'app/models/imageLibraries/ImageAsset';
import { ImageLibraryImage } from 'shared/api/graphql/imageLibraries/fragments';

// Image library section components
import { ImageLibraryItem } from './ImageLibraryItem';

import * as styles from './ImageLibrary.css';
import UploadingAsset from 'app/models/core/UploadingAsset';

const ACCEPTED_IMAGE_FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_IMAGE_FILE_TYPE_NAMES = ['.jpg', '.jpeg', '.png', '.webp'];

interface ImageLibraryProps {
  /** Object describing image library */
  imageLibrary: AccountImageLibrary | BusinessImageLibrary | StaticImageLibrary;
  /** Callback when image is clicked */
  onClickImageAsset?: ((asset: ImageAsset) => void) | null;
  /** Function called with an array of image data after they have been successfully uploaded to the library */
  onUploadImages?: ((imageData: (ImageLibraryImage | null)[]) => void) | null;
  /** Optional URL of currently selected editing field - this component is also used in the Business Profiles menu */
  baseImageFieldURL?: string | null;
  /** Optional array of all image URLs being used in the current template */
  currentTemplateImageURLs?: string[];
  /** Whether the user should be able to upload images to this library in the UI */
  canUpload?: boolean;
  /** Whether this library section should be targeted for drag and drop uploads;
   * this is necessary because the upload drop zone covers the whole image panel, so we can only have
   * one library at a time which can actually recceive those
   * */
  shouldAcceptDragAndDropUploads?: boolean;
  /** The ID of the element that should be used as the drop zone for drag + drop uploads */
  dropZoneTargetId: string;
}

/**
 * Renders an ImageLibrary and its image assets.
 */
export function ImageLibrary({
  imageLibrary,
  onClickImageAsset = null,
  onUploadImages = null,
  baseImageFieldURL = null,
  currentTemplateImageURLs = [],
  canUpload = false,
  shouldAcceptDragAndDropUploads = false,
  dropZoneTargetId,
}: ImageLibraryProps) {
  const imageLibraryAssets = imageLibrary?.assets;

  const [uploadingAssets, setUploadingAssets] = useState<UploadingAsset[]>([]);

  // Do on every render to keep up with external changes to the library or assets
  if (imageLibrary instanceof BaseEditableImageLibrary) {
    imageLibrary.setCurrentUpscaledImages?.(currentTemplateImageURLs);
  }

  useEffect(() =>
    // subscribeToUploadingAssetChanges returns an unsubscribe callback, so we'll just return that
    // so it gets run on cleanup for this effect
    {
      if (imageLibrary instanceof BaseEditableImageLibrary) {
        return imageLibrary?.subscribeToUploadingAssetChanges?.(setUploadingAssets, true);
      }
    }, [imageLibrary]);

  const { isSearchable } = imageLibrary;

  const [searchTerm, setSearchTerm] = useState('');

  // Construct an array of all of the image assets that we should display in this section
  const displayImageAssets = useMemo(() => {
    // If the user has typed in a search term for filtering images by name,
    // we'll use the search results for that term as our list of assets to display
    if (isSearchable && searchTerm) {
      return imageLibrary.search(searchTerm);
    }

    return imageLibraryAssets;
  }, [imageLibrary, searchTerm, isSearchable, imageLibraryAssets]);

  return (
    <div className={styles.ImageLibraryGrid}>
      {isSearchable ? (
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          clearSearch={() => setSearchTerm('')}
          className={styles.ImageLibrarySearchBar}
        />
      ) : null}

      {canUpload ? (
        <EditorFileUploadButton
          onUploadFiles={async (imageFiles) => {
            if (imageLibrary.isEditable && imageLibrary instanceof BaseEditableImageLibrary) {
              const uploadedImages = await Promise.all(
                imageFiles.map((imageFile) => imageLibrary.uploadImageFile(imageFile)),
              );

              onUploadImages?.(uploadedImages);
            }
          }}
          acceptedFileTypes={ACCEPTED_IMAGE_FILE_TYPES}
          acceptedFileNames={ACCEPTED_IMAGE_FILE_TYPE_NAMES}
          shouldAcceptDragAndDropUploads={shouldAcceptDragAndDropUploads}
          dropZoneTargetId={dropZoneTargetId}
          maxFileCount={maxSimultaneousUploadCount}
        />
      ) : null}

      {uploadingAssets.map(({ placeholderID, uploadProgress, shouldAutoIncrementProgress }) => (
        <EditorFileUploadPlaceholder
          key={placeholderID}
          uploadProgress={uploadProgress}
          shouldAutoIncrementProgress={shouldAutoIncrementProgress}
        />
      ))}

      {displayImageAssets.map((asset) => (
        <ImageLibraryItem
          key={asset.guid}
          imageAsset={asset}
          imageLibrary={imageLibrary}
          onClickImageAsset={onClickImageAsset ?? undefined}
          baseImageFieldURL={baseImageFieldURL ?? undefined}
          currentTemplateImageURLs={currentTemplateImageURLs}
        />
      ))}

      {/* If the applied filter has no results, display a message */}
      {searchTerm && displayImageAssets.length === 0 ? (
        <div className={styles.NoResultsMessage}>No results found.</div>
      ) : null}
    </div>
  );
}
