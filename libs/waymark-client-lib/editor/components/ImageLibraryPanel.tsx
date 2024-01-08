// Vendor
import { useMemo } from 'react';
import { css } from '@emotion/css';

// Editor
import EditorModeButton from 'editor/components/EditorModeButton';
import ImageLibrarySection from 'editor/components/ImageLibrarySection';
import { useEditorPanelDispatch } from 'editor/providers/EditorPanelProvider';
import { editorPanelKeys } from 'editor/constants/Editor';
import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';

// Shared
import ErrorBoundary from 'shared/components/ErrorBoundary';
import breakpoints from 'styles/constants/breakpoints.js';
import StaticImageLibrary from 'app/models/imageLibraries/StaticImageLibrary';
import ImageAsset from 'app/models/imageLibraries/ImageAsset';

export type ImageLibraries = AccountImageLibrary | BusinessImageLibrary | StaticImageLibrary;

interface ImageLibraryPanelProps {
  /** User image libraries */
  imageLibraries: ImageLibraries[];
  /** Optional callback when image is clicked */
  onClickLibraryImage?: ((asset: ImageAsset) => void) | null;
  /** Function called with an array of image data after they have been successfully uploaded to the library */
  onUploadLibraryImages?: ((imageData: any[]) => void) | null;
  /** Optional URL of currently selected editing field - this component is also used in the Business Profiles menu */
  baseImageFieldURL?: string;
  /** Optional array of all image URLs being used in the current template */
  currentTemplateImageURLs?: string[];
  /** Whether this image library panel is for a business profile's images, as opposed to the main image panel */
  isBusinessProfilePanel?: boolean;
}

export default function ImageLibraryPanel({
  imageLibraries = [],
  onClickLibraryImage = null,
  onUploadLibraryImages = null,
  baseImageFieldURL = '',
  currentTemplateImageURLs = [],
  isBusinessProfilePanel = false,
}: ImageLibraryPanelProps) {
  const { openControlPanel } = useEditorPanelDispatch();

  // Determine whether any of the image libraries have at least one removed image;
  // if so, we will need to show a button to go to the image restoration panel
  const hasRemovedImages = useMemo(
    () => Boolean(imageLibraries.find((library) => library.removedAssets.length > 0)),
    [imageLibraries],
  );

  const defaultAccountImageLibrary = useMemo(
    // The first account image library is the default account library
    () => imageLibraries.find((library) => library instanceof AccountImageLibrary),
    [imageLibraries],
  );

  const defaultBusinessImageLibrary = useMemo(
    // The first business image library is the default business library
    () => imageLibraries.find((library) => library instanceof BusinessImageLibrary),
    [imageLibraries],
  );

  // Only one library can receive drag+drop uploads; if there's a default business library,
  // we'll prioritize that, otherwise we'll use the default account library
  const primaryDragAndDropUploadLibrary = defaultBusinessImageLibrary || defaultAccountImageLibrary;

  return (
    <div
      className={css`
        margin-bottom: 72px;
      `}
    >
      <ErrorBoundary
        containerClass={css`
          height: calc(100vh - 600px);

          @media ${breakpoints.small.queryDown} {
            height: calc(100vh - 300px);
          }
        `}
      >
        {imageLibraries.map((library, index) => (
          <ImageLibrarySection
            key={library.key}
            library={library}
            currentTemplateImageURLs={currentTemplateImageURLs}
            onClickImageAsset={onClickLibraryImage ?? undefined}
            onUploadLibraryImages={onUploadLibraryImages ?? undefined}
            baseImageFieldURL={baseImageFieldURL}
            // Only the first library section should be expanded by default
            isInitiallyExpanded={index === 0}
            shouldAcceptDragAndDropUploads={library === primaryDragAndDropUploadLibrary}
          />
        ))}
        {/* Only show the button to the image restoration panel
            if at least one of the libraries has removed images,
            and if being used in the editor*/}
        {hasRemovedImages && (
          <EditorModeButton
            onClick={() =>
              openControlPanel(editorPanelKeys.restoreRemovedImages, {
                isBusinessProfilePanel,
              })
            }
            analyticsAction="selected_restore_removed_images"
            primaryText="Deleted Images"
            subText="View and restore deleted images"
            className={css`
              margin: 24px auto 0;
            `}
          />
        )}
      </ErrorBoundary>
    </div>
  );
}
