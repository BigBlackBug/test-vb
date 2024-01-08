// Vendor
import { useEffect, useState } from 'react';
import classNames from 'classnames';

// App
import { InfoBox } from '@libs/shared-ui-components';
import { editableBusinessDetailFields } from 'app/constants/editableBusinessDetailFields';
import { useColorLibrariesForBusiness } from 'app/models/colorLibraries/hooks';
import BusinessLogoImage from 'app/components/BusinessLogoImage';
import { WaymarkButton } from 'shared/components/WaymarkButton/WaymarkButton';
import { BrandModalSteps } from 'app/components/BrandsModal/state/flow';
import { FontIcon, MediaPhotoIcon, MediaVideoIcon } from 'app/icons/MediaIcons';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import { BRAND_SEARCH_STATUS } from 'shared/services/BrandSearchService';
import { useBrandSearchStatus, useErrorMessage } from 'app/state/brandSearchStore';
import { safeLocalStorage } from 'shared/utils/safeStorage';

// Editor
import { useUpdateBusinessFormData } from 'editor/hooks/businessData';

// Styles
import { useTypography } from 'styles/hooks/typography.js';

// Local
import ColorLibrarySection from './ColorLibrarySection.js';
import BusinessInfoFieldTextInput from './BusinessInfoFieldTextInput';
import * as styles from './PrimaryBusinessDetailsForm.css';
import * as controlButtonStyles from './panels/Main/ControlPanelButton.css';
import { useMissingBusinessFields } from 'app/hooks/businesses';
import DeleteBusinessProfileButton from './DeleteBusinessProfileButton';

interface PrimaryBusinessDetailsFormProps {
  /** Optional dict containing existing business data - used during business editing */
  businessDetails: CoreBusinessDetails;
  /** Optional, for use within the editor to show icons for various asset tabs. Defaults to false. */
  isEditor?: boolean;
  /** Optional callback to open a specific panel for use outside of the editor. */
  onOpenPanel?: ((panelKey: BrandModalSteps) => void) | null;
}

/**
 * Renders a set of text inputs depicting editable essential business data
 */
export default function PrimaryBusinessDetailsForm({
  businessDetails,
  isEditor = false,
  onOpenPanel = null,
}: PrimaryBusinessDetailsFormProps) {
  const { businessColorLibraries } = useColorLibrariesForBusiness(businessDetails.guid ?? null);
  const onBusinessFormFieldChanged = useUpdateBusinessFormData(businessDetails.guid);
  const [shouldShowMissingInfoBox, setShouldShowMissingInfoBox] = useState(true);

  const [headlineTextStyle] = useTypography(['headline']);

  const { logoImage } = businessDetails || {};
  const logoImageUrl = logoImage?.upscaledImageUrl
    ? logoImage?.upscaledImageUrl
    : logoImage?.baseUrl;

  const hideMissingInfoBox = () => {
    // save to local storage so that the modal doesn't show again
    safeLocalStorage.setItem(`${businessDetails.guid}:dismissedMissingInfoBoxModal`, 'y');
    setShouldShowMissingInfoBox(false);
  };

  useEffect(() => {
    // check if the user has dismissed the modal before
    setShouldShowMissingInfoBox(
      !Boolean(safeLocalStorage.getItem(`${businessDetails.guid}:dismissedMissingInfoBoxModal`)),
    );
  }, [businessDetails.guid]);

  const missingBusinessDetails = useMissingBusinessFields(businessDetails);

  const brandSearchStatus = useBrandSearchStatus();
  const searchErrorMessage = useErrorMessage();

  const shouldShowErrorMessage =
    Boolean(searchErrorMessage) && brandSearchStatus === BRAND_SEARCH_STATUS.error;

  return (
    <>
      {missingBusinessDetails.isInvalid && shouldShowMissingInfoBox ? (
        <InfoBox colorTheme="Warning" onClose={() => hideMissingInfoBox()}>
          <div>
            {shouldShowErrorMessage ? <p>{searchErrorMessage}</p> : null}
            <p>
              Consider filling out the missing information to help Waymark AI improve details in
              your video.
            </p>
            <ul className={styles.BulletList}>
              {missingBusinessDetails.isMissingName && <li>Business name</li>}
              {missingBusinessDetails.isMissingLogo && <li>Logo</li>}
              {missingBusinessDetails.isMissingColors && <li>Colors</li>}
              {missingBusinessDetails.isMissingAbout && <li>About</li>}
              {missingBusinessDetails.isMissingImages && <li>10 Images</li>}
            </ul>
          </div>
        </InfoBox>
      ) : null}
      <div className={styles.FormContainer}>
        <div className={styles.LogoContainer}>
          <div className={classNames(styles.SectionTitle, headlineTextStyle)}>Logo</div>
          <BusinessLogoImage
            businessGuid={businessDetails.guid as string}
            imageUrl={logoImageUrl as string}
          />
        </div>

        <div className={styles.ColorsContainer}>
          <div className={classNames(styles.SectionTitle, headlineTextStyle)}>Colors</div>
          {businessColorLibraries[0] ? (
            <ColorLibrarySection
              maxColors={20}
              colorLibrary={businessColorLibraries[0]}
              colorLibraryClassName={styles.ColorLibrary}
            />
          ) : null}
        </div>
      </div>

      <BusinessInfoFieldTextInput
        label="Website"
        name={editableBusinessDetailFields.websiteUrl}
        placeholder="website.com"
        businessDetails={businessDetails}
        onChange={onBusinessFormFieldChanged}
      />
      <div className={styles.AssetLibraryButtonsContainer}>
        <WaymarkButton
          onClick={() => onOpenPanel?.(BrandModalSteps.IMAGE_LIBRARY)}
          colorTheme="Secondary"
          isSmall
          className={styles.ControlPanelButton}
        >
          <MediaPhotoIcon />
          <span className={controlButtonStyles.ControlPanelButtonText}>Images</span>
        </WaymarkButton>

        <WaymarkButton
          onClick={() => onOpenPanel?.(BrandModalSteps.FOOTAGE_LIBRARY)}
          colorTheme="Secondary"
          isSmall
          className={styles.ControlPanelButton}
        >
          <MediaVideoIcon />
          <span className={controlButtonStyles.ControlPanelButtonText}>Footage</span>
        </WaymarkButton>

        <WaymarkButton
          onClick={() => onOpenPanel?.(BrandModalSteps.FONT_LIBRARY)}
          colorTheme="Secondary"
          isSmall
          className={styles.ControlPanelButton}
        >
          <FontIcon />
          <span className={controlButtonStyles.ControlPanelButtonText}>Fonts</span>
        </WaymarkButton>
      </div>
      <BusinessInfoFieldTextInput
        label="Business name"
        name={editableBusinessDetailFields.businessName}
        placeholder="Company ABC"
        businessDetails={businessDetails}
        onChange={onBusinessFormFieldChanged}
      />
      <BusinessInfoFieldTextInput
        label="About"
        name={editableBusinessDetailFields.businessAbout}
        placeholder="Tell us about your business"
        businessDetails={businessDetails}
        onChange={onBusinessFormFieldChanged}
        minRows={2}
        maxRows={6}
        shouldExpandWithDynamicRows
      />
      <BusinessInfoFieldTextInput
        label="Industry"
        name={editableBusinessDetailFields.industryName}
        placeholder="Industry (be specific)"
        businessDetails={businessDetails}
        onChange={onBusinessFormFieldChanged}
      />
      <BusinessInfoFieldTextInput
        label="Phone number"
        name={editableBusinessDetailFields.contactPhone}
        placeholder="555-555-5555"
        businessDetails={businessDetails}
        onChange={onBusinessFormFieldChanged}
      />
      <fieldset>
        <legend className={classNames(styles.SectionTitle, headlineTextStyle)}>Address</legend>
        <BusinessInfoFieldTextInput
          name={editableBusinessDetailFields.streetAddress1}
          placeholder="Address line 1"
          businessDetails={businessDetails}
          onChange={onBusinessFormFieldChanged}
        />
        <BusinessInfoFieldTextInput
          name={editableBusinessDetailFields.streetAddress2}
          placeholder="Address line 2"
          businessDetails={businessDetails}
          onChange={onBusinessFormFieldChanged}
        />
        <BusinessInfoFieldTextInput
          name={editableBusinessDetailFields.city}
          placeholder="City"
          businessDetails={businessDetails}
          onChange={onBusinessFormFieldChanged}
        />
        <div className={styles.StateAndZip}>
          <BusinessInfoFieldTextInput
            name={editableBusinessDetailFields.state}
            placeholder="State"
            businessDetails={businessDetails}
            onChange={onBusinessFormFieldChanged}
          />
          <BusinessInfoFieldTextInput
            name={editableBusinessDetailFields.postalCode}
            placeholder="Zip code"
            businessDetails={businessDetails}
            onChange={onBusinessFormFieldChanged}
          />
        </div>
      </fieldset>
      <DeleteBusinessProfileButton isEditor={isEditor} businessDetails={businessDetails} />
    </>
  );
}
