// Vendor
import { AssetLibraryItemButton } from 'editor/components/AssetLibraryItemButton';
import { AssetLibraryItemBadge } from 'editor/components/AssetLibraryItemBadge';
import { AssetLibraryItemToolbarButton } from 'editor/components/AssetLibraryItemToolbarButton';
import { ImageLibraries } from 'editor/components/ImageLibraryPanel';

// Shared
import { useConfirmationModalProtectedAction } from 'shared/hooks/confirmationModal';
import { updateBusiness } from 'shared/api/graphql/businesses/mutations';
import { DynamicBackgroundProgressiveImage } from 'shared/components/DynamicBackgroundProgressiveImage';

// Waymark app dependencies
import { CloseIcon } from 'app/icons/BasicIcons';
import { LogoIcon, RemoveLogoIcon } from 'app/icons/MediaIcons';
import { WandIcon } from 'app/icons/ToolsAndActionsIcons';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import ImageAsset from 'app/models/imageLibraries/ImageAsset';
import { FacebookIcon, ShutterstockIcon } from 'app/icons/ServiceIcons';
import { ImageSources } from 'app/models/imageLibraries/types';
import { PeopleIcon } from 'app/icons/PeopleAndSharingIcons';
import { WebsiteIcon } from 'app/icons/PresenceAndSharingIcons';

// Styles
import * as styles from './ImageLibraryItem.css';
import { useCallback, useMemo } from 'react';

interface ImageLibraryItemProps {
  /** The image asset to render as an item in the library */
  imageAsset: ImageAsset;
  /** Callback when image is clicked */
  onClickImageAsset?: ((asset: ImageAsset) => void) | null;
  /** Optional URL of currently selected editing field - this component is also used in the Business Profiles menu */
  baseImageFieldURL?: string | null;
  /** Optional array of all image URLs being used in the current template */
  currentTemplateImageURLs: string[];
  /** The image library that the asset is in */
  imageLibrary: ImageLibraries;
}

// Icon components to display given the source of the image
const imageSourceIcons: Record<string, React.ReactNode> = {
  [ImageSources.Facebook]: <FacebookIcon />,
  [ImageSources.Shutterstock]: <ShutterstockIcon />,
  [ImageSources.BusinessWebsite]: <WebsiteIcon />,
  [ImageSources.UserUpload]: <PeopleIcon />,
} as const;

/**
 * Renders an item in an image library
 */
export function ImageLibraryItem({
  imageAsset,
  onClickImageAsset = null,
  baseImageFieldURL = null,
  currentTemplateImageURLs,
  imageLibrary,
}: ImageLibraryItemProps) {
  const { imageURL, displayName, guid, isLogo, isUpscaled } = imageAsset;

  const isImageInUse = currentTemplateImageURLs.includes(imageURL);
  const isSelected = baseImageFieldURL === imageURL;

  const removeAsset = useMemo(
    () => ('removeImage' in imageLibrary ? () => imageLibrary.removeImage(imageAsset) : null),
    [imageAsset, imageLibrary],
  );

  let businessGUID: string | null = null;
  let logoImageGUID = null;

  if (imageLibrary instanceof BusinessImageLibrary) {
    businessGUID = imageLibrary.businessGUID;
    logoImageGUID = imageLibrary.logoImageGUID;
  }

  // Removes the currently selected logo image on the business, if applicable
  const removeBusinessLogo = useCallback(() => {
    if (businessGUID) {
      updateBusiness({
        guid: businessGUID,
        // Pass null as the logo image guid to clear the current selection
        logoImageGuid: null,
      });
    }
  }, [businessGUID]);

  const updateBusinessLogo = useCallback(() => {
    if (businessGUID) {
      updateBusiness({
        guid: businessGUID,
        logoImageGuid: guid,
      });
    }
  }, [businessGUID, guid]);

  // Action sets this image as the business' logo image; if the business already has a logo image,
  // we will pop up a confirmation modal to confirm whether the user wants to replace the existing logo
  const [setBusinessLogo, setBusinessLogoConfirmationModal] = useConfirmationModalProtectedAction(
    () => updateBusinessLogo(),
    {
      // We can skip confirmation if the business doesn't already have a logo
      shouldSkipConfirmation: !logoImageGUID,
      title: 'Set Image as Logo',
      subtitle: 'This will override your brand’s current logo.',
      confirmButtonText: 'Set',
      modalProps: {
        cancelInterface: 'text',
      },
    },
  );

  // Construct the action button configs for the mobile long-press action modal
  const longPressModalActionConfigs = useMemo(
    () => [
      onClickImageAsset
        ? {
            actionName: isSelected ? 'Selected' : 'Select',
            action: () => onClickImageAsset(imageAsset),
            buttonProps: {
              // Disable the button if the image is already selected in the long press modal
              isDisabled: isSelected,
            },
          }
        : null,
      businessGUID && isLogo
        ? {
            actionName: 'Remove as Logo',
            action: removeBusinessLogo,
          }
        : null,
      businessGUID && !isLogo
        ? {
            actionName: 'Set as Logo',
            action: setBusinessLogo,
          }
        : null,
      removeAsset
        ? {
            actionName: 'Remove',
            action: removeAsset,
            buttonProps: {
              colorTheme: 'Negative',
            },
          }
        : null,
    ],
    [
      businessGUID,
      imageAsset,
      isLogo,
      isSelected,
      onClickImageAsset,
      removeAsset,
      removeBusinessLogo,
      setBusinessLogo,
    ],
  );

  const sourceIcon = imageAsset.source ? imageSourceIcons[imageAsset.source.toLowerCase()] : null;

  // If the library image has an uploadProgress attribute, an upload is in progress and we
  // should render a placeholder box.
  return (
    <>
      <AssetLibraryItemButton
        // The primary action when clicking the asset should be to select it for for the image field
        // currently being edited, if applicable
        onClick={() => onClickImageAsset?.(imageAsset)}
        className={styles.ImageAssetButton}
        isDisabled={!onClickImageAsset}
        isSelected={isSelected}
        assetDisplayName={displayName}
        actionModalTitle="Image Actions"
        longPressModalActionConfigs={longPressModalActionConfigs}
        toolbarButtons={
          <>
            {/* If this asset is removable, render a toolbar button to remove it */}
            {imageLibrary.isEditable ? (
              <AssetLibraryItemToolbarButton
                onClick={removeAsset || undefined}
                tooltipText="Remove"
              >
                <CloseIcon />
              </AssetLibraryItemToolbarButton>
            ) : null}
            {/* If this is a business image, add a button to select/remove it as the business' logo */}
            {businessGUID &&
              (isLogo ? (
                // If the image is currently selected as a logo, provide a button to deselect it
                <AssetLibraryItemToolbarButton
                  onClick={removeBusinessLogo}
                  colorTheme="Primary"
                  tooltipText="Remove as Logo"
                >
                  <RemoveLogoIcon />
                </AssetLibraryItemToolbarButton>
              ) : (
                // If the image is not currently selected as a logo, provide a button to select it
                <AssetLibraryItemToolbarButton onClick={setBusinessLogo} tooltipText="Set as Logo">
                  <LogoIcon />
                </AssetLibraryItemToolbarButton>
              ))}
          </>
        }
        overlayBadges={
          <>
            {isUpscaled ? (
              <AssetLibraryItemBadge className={styles.BadgeWithIcon}>
                <WandIcon />
              </AssetLibraryItemBadge>
            ) : null}
            {/* If it's a logo image, include a badge with the logo icon */}
            {isLogo ? (
              <AssetLibraryItemBadge className={styles.BadgeWithIcon}>
                <LogoIcon />
              </AssetLibraryItemBadge>
            ) : null}
            {sourceIcon ? (
              <AssetLibraryItemBadge className={styles.BadgeWithIcon}>
                {sourceIcon}
              </AssetLibraryItemBadge>
            ) : null}
            {/* If this image is being used in the video, show an "in use" badge */}
            {isImageInUse ? <AssetLibraryItemBadge>in use</AssetLibraryItemBadge> : null}
          </>
        }
      >
        <DynamicBackgroundProgressiveImage
          src={imageURL}
          alt="Library image"
          imageWrapperClassName={styles.ImageAssetWrapper}
        />
      </AssetLibraryItemButton>
      {setBusinessLogoConfirmationModal}
    </>
  );
}
