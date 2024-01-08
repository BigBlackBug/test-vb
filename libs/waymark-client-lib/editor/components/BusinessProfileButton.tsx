// Vendor
import { useCallback, useState } from 'react';

// Editor
import { useEditorState } from 'editor/providers/EditorStateProvider.js';
import BusinessProfileModeButton from 'editor/components/BusinessProfileModeButton';
import BrandItButton from 'editor/components/BrandItButton';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import { AddIcon } from 'app/icons/BasicIcons';
import { RefreshIcon } from 'app/icons/ToolsAndActionsIcons';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './BusinessProfileButton.css';
import { BrandsModal } from 'app/components/BrandsModal';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import BrandItModal from './BrandItModal';
import { useSelectedBusinessGUID } from 'app/state/brandSelectionStore';

interface AddABrandButtonProps {
  /**
   * Opens the business profile panel
   */
  onClickOpenBusinessProfilePanel: () => void;
}

/**
 * If the user doesn't have a business selected, display a fancy "Brand it" button to open the business profile panel
 */
function AddABrandButton({ onClickOpenBusinessProfilePanel }: AddABrandButtonProps) {
  return (
    <WaymarkButton
      onClick={onClickOpenBusinessProfilePanel}
      colorTheme="AI"
      className={styles.AddABrandButton}
      isUppercase={false}
    >
      <div className={styles.AddIconOutline}>
        <AddIcon />
      </div>
      <div>
        <h2 className={styles.ChooseABrandHeading}>Choose a brand</h2>
        <p className={styles.ChooseABrandSubheading}>Brand your video in seconds</p>
      </div>
    </WaymarkButton>
  );
}

/**
 * Renders a button which displays the logo and name for the user's selected business profile if applicable
 * and opens the business profile list control panel when clicked
 */
export default function BusinessProfileButton() {
  const { appliedBusinessDetails, isAppliedBusinessLoading } = useEditorState();

  const [shouldShowBrandsModal, setShouldShowBrandsModal] = useState(false);
  const [shouldShowBrandItModal, setShouldShowBrandItModal] = useState(false);
  const [newlyAppliedBusinessDetails, setNewlyAppliedBusinessDetails] =
    useState<CoreBusinessDetails | null>(null);

  const onClickOpenBusinessProfilePanel = useCallback(() => {
    // The business profiles panel is login-protected, so if the user isn't logged in,
    // open a login modal and require them to log in before allowing them to procceed
    // Proceed to open the business profiles list panel if/when the user is logged in
    setShouldShowBrandsModal(true);
  }, []);

  const hasAppliedBusiness = Boolean(appliedBusinessDetails) || isAppliedBusinessLoading;

  const [selectedBusinessGUID, setSelectedBusinessGUID] = useSelectedBusinessGUID();

  return (
    <>
      <CrossFadeTransition transitionKey={hasAppliedBusiness}>
        {hasAppliedBusiness ? (
          <div className={styles.AppliedBusinessSectionWrapper}>
            <BusinessProfileModeButton
              businessDetails={appliedBusinessDetails}
              isLoading={isAppliedBusinessLoading}
              shouldShowRemoveButton
              buttonColorTheme={null}
              buttonClassName={styles.AppliedbusinessProfileButton}
              onClick={() => {
                if (hasAppliedBusiness) {
                  setSelectedBusinessGUID(appliedBusinessDetails?.guid ?? null);
                }
                setShouldShowBrandsModal(true);
              }}
            />
            <div className={styles.RemakeSection}>
              <span>Get a fresh custom video</span>
              <BrandItButton
                analyticsLabel="remake"
                businessDetails={appliedBusinessDetails}
                className={styles.RemakeButton}
              >
                <RefreshIcon className={styles.RemakeButtonIcon} />
                Remake
              </BrandItButton>
            </div>
          </div>
        ) : (
          <AddABrandButton onClickOpenBusinessProfilePanel={onClickOpenBusinessProfilePanel} />
        )}
      </CrossFadeTransition>

      <BrandsModal
        isEditor
        selectedBusinessGUID={selectedBusinessGUID ?? null}
        modalSize="450px"
        isVisible={shouldShowBrandsModal}
        onCloseModal={() => {
          setShouldShowBrandsModal(false);
        }}
        onApplyBrand={(businessDetails) => {
          setNewlyAppliedBusinessDetails(businessDetails);
          setShouldShowBrandsModal(false);
          setShouldShowBrandItModal(true);
        }}
      />

      <BrandItModal
        isVisible={shouldShowBrandItModal}
        onCloseModal={() => {
          setShouldShowBrandItModal(false);
          setNewlyAppliedBusinessDetails(null);
        }}
        businessDetails={newlyAppliedBusinessDetails}
      />
    </>
  );
}
