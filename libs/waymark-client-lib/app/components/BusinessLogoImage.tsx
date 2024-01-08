// Vendor
import { useState } from 'react';
import { css } from '@emotion/css';

// Shared
import FileBrowserUploadButton from 'shared/components/FileBrowserUploadButton';
import { RotatingLoader } from '@libs/shared-ui-components';
import { DynamicBackgroundProgressiveImage } from 'shared/components/DynamicBackgroundProgressiveImage';
import { updateBusiness } from 'shared/api/graphql/businesses/mutations';

// App
import { CloseIcon } from 'app/icons/BasicIcons';
import { UploadIcon } from 'app/icons/PeopleAndSharingIcons';
import { useBusinessImageLibraries } from 'app/models/imageLibraries/hooks';

// Editor
import { AssetLibraryItemButton } from 'editor/components/AssetLibraryItemButton';
import { AssetLibraryItemToolbarButton } from 'editor/components/AssetLibraryItemToolbarButton';
import EditorLongPressModalProvider from 'editor/providers/EditorLongPressModalProvider.js';

// Styles
import { useTypography } from 'styles/hooks/typography.js';

const ACCEPTED_IMAGE_FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];

interface BusinessLogoImageProps {
  /** URL for the image to be displayed */
  imageUrl?: string | null;
  /** Guid of the business for which we are editing the logo */
  businessGuid: string;
}

export default function BusinessLogoImage({
  imageUrl = null,
  businessGuid,
}: BusinessLogoImageProps) {
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [caption2TextStyle] = useTypography(['caption2']);
  const { businessImageLibraries } = useBusinessImageLibraries(businessGuid);

  const setBusinessLogo = (logo: string | null = null) =>
    updateBusiness({
      guid: businessGuid,
      logoImageGuid: logo,
    });

  return (
    <div>
      {imageUrl ? (
        <EditorLongPressModalProvider>
          <AssetLibraryItemButton
            toolbarButtons={
              <AssetLibraryItemToolbarButton
                onClick={() => {
                  setBusinessLogo(null);
                }}
                tooltipText="Remove"
              >
                <CloseIcon />
              </AssetLibraryItemToolbarButton>
            }
            className={css`
              user-select: none;
              img {
                /* Disable iOS Safari's disruptive long-press image interaction */
                pointer-events: none;
              }
            `}
          >
            <DynamicBackgroundProgressiveImage
              src={imageUrl}
              alt="Logo image"
              imageWrapperClassName={css`
                border-radius: 2px;
              `}
            />
          </AssetLibraryItemButton>
        </EditorLongPressModalProvider>
      ) : (
        <div
          className={css`
            position: relative;
          `}
        >
          <FileBrowserUploadButton
            data-isuploading={isImageUploading}
            onUploadFiles={async (imageFiles) => {
              setIsImageUploading(true);
              const uploadedImage = await businessImageLibraries[0].uploadImageFile(imageFiles[0]);
              setBusinessLogo(uploadedImage?.guid as string);
              setIsImageUploading(false);
            }}
            acceptedMimeTypes={ACCEPTED_IMAGE_FILE_TYPES}
            disabled={isImageUploading}
            className={css`
              /* Overriding default button style  */
              padding: 4px !important;
              width: 100%;
              &[data-isuploading='true'] {
                opacity: 0.3;
              }
            `}
          >
            <div
              className={css`
                aspect-ratio: 1;
                padding: 4px;

                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                border-radius: 4px;
              `}
            >
              <UploadIcon
                className={css`
                  width: 24px;
                `}
              />
              <p
                className={css`
                  ${caption2TextStyle}
                `}
              >
                Upload
              </p>
            </div>
          </FileBrowserUploadButton>
          {isImageUploading ? (
            <RotatingLoader
              className={css`
                position: absolute;
                width: 40%;
                z-index: 100;
                border: none !important;
                left: 30%;
                top: 30%;
              `}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
