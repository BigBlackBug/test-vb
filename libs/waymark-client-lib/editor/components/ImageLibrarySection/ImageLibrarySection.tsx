// Vendor
import EditorCollapsibleLibrarySection from 'editor/components/EditorCollapsibleLibrarySection.js';

// Waymark app dependencies
import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import StaticImageLibrary from 'app/models/imageLibraries/StaticImageLibrary';
import ImageAsset from 'app/models/imageLibraries/ImageAsset';
import { ImageLibraryImage } from 'shared/api/graphql/imageLibraries/fragments';

import { ImageLibrary } from './ImageLibrary';

interface ImageLibrarySectionProps {
  /** Object describing this library section */
  library: AccountImageLibrary | BusinessImageLibrary | StaticImageLibrary;
  /** Callback when image is clicked */
  onClickImageAsset?: ((asset: ImageAsset) => void) | null;
  /** Function called with an array of image data after they have been successfully uploaded to the library */
  onUploadLibraryImages?: ((imageData: (ImageLibraryImage | null)[]) => void) | null;
  /** Optional URL of currently selected editing field - this component is also used in the Business Profiles menu */
  baseImageFieldURL?: string | null;
  /** Optional array of all image URLs being used in the current template */
  currentTemplateImageURLs?: string[];
  /** Whether this section should be expanded by default */
  isInitiallyExpanded?: boolean;
  /** Whether this library section should be targeted for drag and drop uploads;
   * this is necessary because the upload drop zone covers the whole image panel, so we can only have
   *  one library at a time which can actually recceive those
   * */
  shouldAcceptDragAndDropUploads?: boolean;
}

/**
 * Collapsible section containing a grid of library images
 */
export default function ImageLibrarySection({
  library,
  onUploadLibraryImages = null,
  baseImageFieldURL = null,
  currentTemplateImageURLs = [],
  onClickImageAsset = null,
  isInitiallyExpanded = false,
  shouldAcceptDragAndDropUploads = false,
}: ImageLibrarySectionProps) {
  return (
    <EditorCollapsibleLibrarySection
      primaryText={library.displayName}
      isInitiallyExpanded={isInitiallyExpanded}
    >
      <ImageLibrary
        imageLibrary={library}
        onClickImageAsset={onClickImageAsset}
        onUploadImages={onUploadLibraryImages ?? null}
        currentTemplateImageURLs={currentTemplateImageURLs}
        baseImageFieldURL={baseImageFieldURL}
        canUpload={library.isEditable}
        shouldAcceptDragAndDropUploads={shouldAcceptDragAndDropUploads}
        dropZoneTargetId="wm-editor-controls"
      />
    </EditorCollapsibleLibrarySection>
  );
}
