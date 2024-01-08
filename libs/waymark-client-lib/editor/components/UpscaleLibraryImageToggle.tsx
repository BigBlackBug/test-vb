// Vendor
import { useState } from 'react';

// App
import AccountImageLibrary from 'app/models/imageLibraries/AccountImageLibrary';
import BusinessImageLibrary from 'app/models/imageLibraries/BusinessImageLibrary';
import ImageAsset from 'app/models/imageLibraries/ImageAsset';

// Shared
import { upscaleImageSizeLimit } from 'shared/services/ImageEnhancementService.js';
import WaymarkToggleSwitch from 'shared/components/WaymarkToggleSwitch';
import { WandIcon } from 'app/icons/ToolsAndActionsIcons';
import * as styles from './UpscaleLibraryImageToggle.css';

// Type and prop definitions
// Using enum instead of an object to validate which error states we support
enum ErrorMessage {
  SizeExceeded = "This image is already large and can't be upscaled any more.",
  StockImage = 'This image is a stock photo and cannot be enhanced.',
  Generic = 'There was an error enhancing this image. Please try again.',
}

type CurrentlyEditingLibraryAndAsset = {
  library: AccountImageLibrary | BusinessImageLibrary;
  asset: ImageAsset;
};

interface UpscaleLibraryImageToggleProps {
  // TODO: This should probably be its own interface, but managing the function signatures and
  // return values (which are often functions with their own signatures/return vales) seemed like
  // too big an undertaking for the project scope.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentlyEditingImageField: any;
  currentLibraryAndAsset: CurrentlyEditingLibraryAndAsset;
  isUpscalingImage: boolean;
}

interface ActiveToggleProps extends UpscaleLibraryImageToggleProps {
  errorMessage: ErrorMessage | null;
  setErrorMessage: (errorMessage: ErrorMessage | null) => void;
}

/**
 * Renders the base HTML and styling for the upscale toggle.
 *
 * @param {boolean} isDisabled - Prevent user interaction with toggle
 * @param {boolean} isChecked - If toggle is in the switched "on" position
 * @param {boolean} shouldShowProgressState - Display progress state, also disables toggle
 * @param {string} [errorMessage] - The current error message to display
 */
function BaseUpscaleToggle({
  isDisabled,
  isChecked,
  shouldShowProgressState,
  errorMessage,
  onToggleChecked = () => {},
}: {
  isDisabled: boolean;
  isChecked: boolean;
  shouldShowProgressState: boolean;
  errorMessage: ErrorMessage | null;
  onToggleChecked?: () => void;
}) {
  return (
    <div className={styles.UpscaleToggleSection}>
      <div className={styles.UpscaleToggleContainer} {...styles.dataIsDisabled(isDisabled)}>
        <h3 className={styles.UpscaleToggleHeading}>Upscale image</h3>
        <WandIcon color="currentColor" className={styles.WandIcon} />
        <WaymarkToggleSwitch
          onToggleChecked={onToggleChecked}
          isChecked={isChecked}
          disabled={isDisabled}
          isInProgress={shouldShowProgressState}
          analyticsAction={`selected-${isChecked ? 'disable' : 'enable'}-upscale-image`}
        />
      </div>
      {errorMessage ? <p className={styles.ErrorMessage}>{errorMessage}</p> : null}
    </div>
  );
}

/**
 * Component displays a toggle switch to upscale and revert an active image library asset.
 *
 * @param {CurrentlyEditingLibraryAndAsset} currentLibraryAndAsset - The image library and asset that is currently
 *    selected as the value for the image field. Value will be null if an invalid image type is populated in the image
 *    field.
 * @param {function} setErrorMessage - Display an error message if something goes wrong during upscaling
 * @param {string} [errorMessage] - The current error message to display
 * @param {object} currentlyEditingImageField - The currently selected image field
 * @param {boolean} isUpscalingImage - If a request to upscale the current image asset is in progress
 */
function ActiveUpscaleToggle({
  currentLibraryAndAsset,
  setErrorMessage,
  errorMessage,
  currentlyEditingImageField,
  isUpscalingImage,
}: ActiveToggleProps) {
  const [asset, setAsset] = useState<ImageAsset>(currentLibraryAndAsset.asset);

  const { library } = currentLibraryAndAsset;

  const { useSetImageURL } = currentlyEditingImageField;
  const setImageURL = useSetImageURL();

  const toggleImageUpscaling = async () => {
    setErrorMessage(null);
    // Retain the user selected image modifications when toggling back and forth
    const shouldRetainImageModifications = true;

    // If the upscaled version is being displayed, revert the UI and configuration to the original version
    if (asset.isUpscaled) {
      setImageURL(asset.baseImageURL, shouldRetainImageModifications);
      library.updateAssetScale(asset, false);

      return;
    }

    // If there is an upscaled image available, just update the configuration and UI to display the upscaled version
    if (asset.upscaledImageURL) {
      setImageURL(asset.upscaledImageURL, shouldRetainImageModifications);
      library.updateAssetScale(asset, true);

      return;
    }

    // If there is no upscaled version to display, kick off the request to get an upscaled version
    await library.upscaleImage(
      asset,
      (upscaledImageURL, updatedImageAsset) => {
        setImageURL(upscaledImageURL, shouldRetainImageModifications);
        setAsset(updatedImageAsset);
      },
      () => {
        setErrorMessage(ErrorMessage.Generic);
      },
    );
  };

  return (
    <BaseUpscaleToggle
      isDisabled={isUpscalingImage}
      isChecked={asset.isUpscaled}
      shouldShowProgressState={isUpscalingImage}
      onToggleChecked={toggleImageUpscaling}
      errorMessage={errorMessage}
    />
  );
}

/**
 * Component displays a toggle switch to upscale and revert library image assets.
 * Only account and business images are able to be upscaled. If a different type of
 * image asset is currently selected (account group, stock, original template image)
 * a disabled toggle is displayed.
 *
 * @param {object} currentlyEditingImageField - The currently selected image field
 * @param {CurrentlyEditingLibraryAndAsset} currentLibraryAndAsset - The image library and asset that is currently
 *    selected as the value for the image field. Value will be null if an invalid image type is populated in the image
 *    field.
 * @param {boolean} isUpscalingImage - If a request to upscale the current image asset is in progress
 */
export default function UpscaleLibraryImageToggle({
  currentlyEditingImageField,
  currentLibraryAndAsset,
  isUpscalingImage,
}: UpscaleLibraryImageToggleProps) {
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | null>(() => {
    if (!currentLibraryAndAsset) {
      return ErrorMessage.StockImage;
    }

    // We should also disable the toggle if the image is too large to be upscaled
    // Limit defined in the Image Enhancement Service
    if (
      (currentLibraryAndAsset.asset.height || 0) * (currentLibraryAndAsset.asset.width || 0) >
      upscaleImageSizeLimit
    ) {
      return ErrorMessage.SizeExceeded;
    }

    return null;
  });

  if (errorMessage && errorMessage !== ErrorMessage.Generic) {
    return (
      <BaseUpscaleToggle
        isDisabled
        isChecked={false}
        shouldShowProgressState={false}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <ActiveUpscaleToggle
      currentLibraryAndAsset={currentLibraryAndAsset}
      setErrorMessage={setErrorMessage}
      currentlyEditingImageField={currentlyEditingImageField}
      isUpscalingImage={isUpscalingImage}
      errorMessage={errorMessage}
    />
  );
}
