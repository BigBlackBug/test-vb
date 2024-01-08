// Vendor
import { useState, useCallback } from 'react';

import classNames from 'classnames';

// Editor
import BrandItModal from 'editor/components/BrandItModal.js';

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';

// WAYMARK APP DEPENDENCIES
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

import * as styles from './BrandItButton.css';

interface BrandItButtonProps {
  /* Optional class name to apply additional custom styles to the button */
  className?: string | null;
  /* Optional label to use for analytics to describe where this brand it button is */
  analyticsLabel?: string | null;
  /* The business details object for the business which we want to brand the video for */
  businessDetails?: CoreBusinessDetails;
  /* Contents to display inside the button */
  children: React.ReactNode;
}

/**
 * "Brand it" button opens a confirmation modal which will apply the selected business' personalized variant configuration to the video
 */
export default function BrandItButton({
  className = null,
  analyticsLabel = null,
  businessDetails,
  children,
}: BrandItButtonProps) {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  // Using useCallback because this method is a dependency of an effect in BrandItModalContents
  const onCloseModal = useCallback(() => setIsConfirmationModalOpen(false), []);

  return (
    <>
      <WaymarkButton
        onClick={() => setIsConfirmationModalOpen(true)}
        colorTheme="AI"
        className={classNames(styles.BrandItButton, className)}
        analyticsAction="brand_it_button"
        analyticsLabel={analyticsLabel}
      >
        {children}
      </WaymarkButton>
      <BrandItModal
        isVisible={isConfirmationModalOpen}
        onCloseModal={onCloseModal}
        businessDetails={businessDetails}
      />
    </>
  );
}
