import React, { useState } from 'react';

import { EditorControlPanelHeading } from 'editor/components/EditorControlHeadings';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { useBusinessImageLibraries } from 'app/models/imageLibraries/hooks';

import { ShutterstockTermsModal } from '../ShutterstockTermsModal';
import { StockImageView } from '../StockImageView/StockImageView';
import * as styles from './BrandsModalStockImagePanel.css';

interface BrandsModalStockImagePanelProps {
  businessGUID: string;
}

export default function BrandsModalStockImagePanel({
  businessGUID,
}: BrandsModalStockImagePanelProps) {
  const [shouldShowShutterstockTermsModal, setShouldShowShutterstockTermsModal] = useState(false);

  const { businessImageLibraries } = useBusinessImageLibraries(businessGUID);

  return (
    <>
      <EditorControlPanelHeading
        heading="Search Shutterstock"
        subheading={
          <>
            <strong>Type in a word to search for images on Shutterstock</strong>. Read the{' '}
            <WaymarkButton
              onClick={() => setShouldShowShutterstockTermsModal(true)}
              hasFill={false}
              isUppercase={false}
              colorTheme="PrimaryText"
              typography="inherit"
              className={styles.shutterstockTermsButton}
            >
              Terms of Use
            </WaymarkButton>{' '}
            before getting started.
          </>
        }
      />
      <StockImageView imageLibrary={businessImageLibraries[0]} />
      <ShutterstockTermsModal
        isVisible={shouldShowShutterstockTermsModal}
        onCloseModal={() => setShouldShowShutterstockTermsModal(false)}
        modalSize="large"
        cancelInterface="button"
        cancelButtonText="Okay"
      />
    </>
  );
}
