// Vendor
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';

// Shared
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import { useBusinessDetailsByBusinessGUID } from 'shared/api/graphql/businesses/queries';
import { BRAND_SEARCH_STATUS } from 'shared/services/BrandSearchService';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';

// Editor
import EditorLongPressModalProvider from 'editor/providers/EditorLongPressModalProvider';
import { ImageLibrary } from 'editor/components/ImageLibrarySection/ImageLibrary';
import PrimaryBusinessDetailsForm from 'editor/components/PrimaryBusinessDetailsForm';
import EditorModeButton from 'editor/components/EditorModeButton';

// App
import { useBusinessImageLibraries } from 'app/models/imageLibraries/hooks';
import { SearchIcon } from 'app/icons/BasicIcons';
import { useBrandSearchStatus, useCurrentBrandSearch } from 'app/state/brandSearchStore';
import UploadingAsset from 'app/models/core/UploadingAsset';

// Local
import { BrandSelectionPanel } from './BrandSelectionPanel';
import { BrandModalSteps, setCurrentBrandModalStep, useCurrentBrandModalStep } from './state/flow';
import BrandImportLoading from './BrandImportLoading';
import BrandsModalHeader from './BrandsModalHeader';
import BrandModalVideoLibraryPanel from './BrandsModalVideoLibraryPanel';
import { ASSET_DROPZONE_ID } from './constants';

import * as styles from './BrandsModal.css';
import BrandModalFontsLibraryPanel from './BrandsModalFontsLibraryPanel';
import BrandsModalStockImagePanel from './BrandsModalStockImagePanel';
import BrandsModalFooter from './BrandsModalFooter';

interface BrandsModalProps {
  isEditor?: boolean;
  selectedBusinessGUID: string | null;
  onApplyBrand: (businessDetails: CoreBusinessDetails) => void;
}

const brandsModalHeaderTitles: Record<BrandModalSteps, string | null> = {
  [BrandModalSteps.SELECT_BRAND]: 'Choose Brand',
  [BrandModalSteps.REVIEW_BRAND]: 'Brand Details',
  [BrandModalSteps.FOOTAGE_LIBRARY]: 'Brand Footage',
  [BrandModalSteps.IMAGE_LIBRARY]: 'Brand Images',
  [BrandModalSteps.FONT_LIBRARY]: null,
  [BrandModalSteps.STOCK_IMAGE_LIBRARY]: null,
  [BrandModalSteps.STOCK_FOOTAGE_LIBRARY]: null,
  [BrandModalSteps.LOADING_BRAND]: null,
} as const;

function BrandsModalContents({
  isEditor = false,
  selectedBusinessGUID,
  onApplyBrand,
}: BrandsModalProps) {
  // Keeping track of a temporary selected business GUID in state allows us to
  // preview another business while the modal is open without actually applying it yet
  const [previewingBusinessGUID, setPreviewingBusinessGUID] = useState<string | null>(
    selectedBusinessGUID,
  );

  useEffect(() => {
    // Initially setting the temp selected business GUID to the current selected business GUID
    setPreviewingBusinessGUID(selectedBusinessGUID);
  }, [selectedBusinessGUID]);

  const selectedBusinessDetails =
    useBusinessDetailsByBusinessGUID(previewingBusinessGUID)?.businessDetails;

  const currentBrandModalStep = useCurrentBrandModalStep();

  const currentBrandSearch = useCurrentBrandSearch();
  const brandSearchStatus = useBrandSearchStatus();

  const { businessImageLibraries } = useBusinessImageLibraries(previewingBusinessGUID);

  /**
   * While adding this to a store would be ideal, it's probably not worth the effort for now
   * As long as the modal is open, this state will be used to track the uploading video assets,
   * no matter the brand that is selected, or what step of the flow we're in
   */
  const [uploadingVideoAssets, setUploadingVideoAssets] = useState<UploadingAsset[]>([]);

  const isInitialRender = useRef(true);

  // Effect sets the initial brand modal step to show when the modal is first opened
  useEffect(() => {
    if (!isInitialRender.current) {
      return;
    }

    isInitialRender.current = false;

    if (previewingBusinessGUID && brandSearchStatus !== BRAND_SEARCH_STATUS.searching) {
      setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
    } else if (brandSearchStatus === BRAND_SEARCH_STATUS.searching) {
      setCurrentBrandModalStep(BrandModalSteps.LOADING_BRAND);
    } else {
      setCurrentBrandModalStep(BrandModalSteps.SELECT_BRAND);
    }
  }, [brandSearchStatus, currentBrandSearch, previewingBusinessGUID]);

  return (
    <div id={ASSET_DROPZONE_ID}>
      <CrossFadeTransition transitionKey={currentBrandModalStep}>
        <BrandsModalHeader
          currentBrandModalStep={currentBrandModalStep}
          onSelectBrand={(guid) => {
            setPreviewingBusinessGUID(guid);
            setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
          }}
        />
        <div className={styles.BrandsModalContent}>
          {brandsModalHeaderTitles[currentBrandModalStep] ? (
            <WaymarkModalHeading title={brandsModalHeaderTitles[currentBrandModalStep]} />
          ) : null}

          {currentBrandModalStep === BrandModalSteps.SELECT_BRAND ? (
            <BrandSelectionPanel
              currentSelectedBusinessGUID={selectedBusinessGUID}
              onSelectBrand={(guid) => setPreviewingBusinessGUID(guid)}
            />
          ) : null}

          <EditorLongPressModalProvider>
            {selectedBusinessDetails && currentBrandModalStep === BrandModalSteps.REVIEW_BRAND ? (
              <PrimaryBusinessDetailsForm
                isEditor={isEditor}
                onOpenPanel={(step) => setCurrentBrandModalStep(step)}
                businessDetails={selectedBusinessDetails}
              />
            ) : null}

            {currentBrandModalStep === BrandModalSteps.IMAGE_LIBRARY && previewingBusinessGUID ? (
              <>
                <EditorModeButton
                  onClick={() => setCurrentBrandModalStep(BrandModalSteps.STOCK_IMAGE_LIBRARY)}
                  analyticsAction="selected_stock_image_search"
                  primaryText="Search for Stock Photos"
                  subText="powered by Shutterstock"
                  icon={<SearchIcon />}
                />

                {!_.isEmpty(businessImageLibraries) ? (
                  <ImageLibrary
                    imageLibrary={businessImageLibraries[0]}
                    canUpload={businessImageLibraries[0].isEditable}
                    shouldAcceptDragAndDropUploads
                    dropZoneTargetId={ASSET_DROPZONE_ID}
                  />
                ) : null}
              </>
            ) : null}

            {currentBrandModalStep === BrandModalSteps.STOCK_IMAGE_LIBRARY &&
            previewingBusinessGUID ? (
              <>
                <BrandsModalStockImagePanel businessGUID={previewingBusinessGUID} />
              </>
            ) : null}

            {currentBrandModalStep === BrandModalSteps.FOOTAGE_LIBRARY && previewingBusinessGUID ? (
              <>
                <BrandModalVideoLibraryPanel
                  dropZoneTargetId={ASSET_DROPZONE_ID}
                  businessGUID={previewingBusinessGUID}
                  uploadingVideoAssets={uploadingVideoAssets}
                  setUploadingVideoAssets={setUploadingVideoAssets}
                />
              </>
            ) : null}

            {currentBrandModalStep === BrandModalSteps.FONT_LIBRARY &&
            previewingBusinessGUID &&
            selectedBusinessDetails ? (
              <BrandModalFontsLibraryPanel businessDetails={selectedBusinessDetails} />
            ) : null}
          </EditorLongPressModalProvider>
          {currentBrandModalStep === BrandModalSteps.LOADING_BRAND ? <BrandImportLoading /> : null}
        </div>
        <BrandsModalFooter
          currentBrandModalStep={currentBrandModalStep}
          onSelectBrand={(guid) => {
            setPreviewingBusinessGUID(guid);
            setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
          }}
          onApplyBrand={() => {
            if (selectedBusinessDetails && onApplyBrand) {
              onApplyBrand(selectedBusinessDetails);
            }
            setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
          }}
        />
      </CrossFadeTransition>
    </div>
  );
}

export const BrandsModal = withWaymarkModal()(BrandsModalContents);
