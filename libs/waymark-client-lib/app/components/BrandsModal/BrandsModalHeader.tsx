// Vendor
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';

// Local
import { BrandModalSteps, setCurrentBrandModalStep } from './state/flow';
import * as styles from './BrandsModalHeader.css';
import { useActiveBrandSearchURL } from 'app/state/brandSearchStore';
import { useCreateBusinessForLoggedInAccount } from 'shared/api/graphql/businesses/mutations';
import { ModalHeaderSection } from '@libs/shared-ui-components/src';

// This ensures that even if we don't have a header for a given step, we still take up the same
// amount of vertical space in the modal
const EmptyBrandHeader = () => <ModalHeaderSection />;

const SelectBrandHeader = ({ onSelectBrand }: { onSelectBrand: (guid: string) => void }) => {
  const createBusiness = useCreateBusinessForLoggedInAccount();

  return (
    <ModalHeaderSection>
      <WaymarkButton
        onClick={async () => {
          const newBusiness = await createBusiness();
          const businessGUID = newBusiness.data?.createBusiness?.createdBusiness?.guid;
          if (businessGUID) {
            onSelectBrand(businessGUID);
          }
        }}
        colorTheme="Secondary"
      >
        Add Manually
      </WaymarkButton>
    </ModalHeaderSection>
  );
};

const ReviewBrandHeader = () => (
  <ModalHeaderSection>
    <WaymarkButton
      colorTheme="Secondary"
      onClick={() => {
        setCurrentBrandModalStep(BrandModalSteps.SELECT_BRAND);
      }}
    >
      Change Brand
    </WaymarkButton>
  </ModalHeaderSection>
);

const AssetLibraryHeader = () => {
  return (
    <ModalHeaderSection>
      <WaymarkButton
        colorTheme="Secondary"
        onClick={() => {
          setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
        }}
      >
        Back
      </WaymarkButton>
    </ModalHeaderSection>
  );
};

const StockImageLibraryHeader = () => {
  return (
    <ModalHeaderSection>
      <WaymarkButton
        colorTheme="Secondary"
        onClick={() => {
          setCurrentBrandModalStep(BrandModalSteps.IMAGE_LIBRARY);
        }}
      >
        Back
      </WaymarkButton>
    </ModalHeaderSection>
  );
};

const StockFootageLibraryHeader = () => {
  return (
    <ModalHeaderSection>
      <WaymarkButton
        colorTheme="Secondary"
        onClick={() => {
          setCurrentBrandModalStep(BrandModalSteps.FOOTAGE_LIBRARY);
        }}
      >
        Back
      </WaymarkButton>
    </ModalHeaderSection>
  );
};

const LoadingBrandHeader = () => {
  const searchURL = useActiveBrandSearchURL();

  return (
    <WaymarkModalHeading
      title="Choose Brand"
      subText={
        <>
          Importing images, business info, and more for{' '}
          {searchURL ? <strong className={styles.searchURL}>{searchURL}</strong> : 'your brand'}
        </>
      }
      className={styles.modalHeading}
    />
  );
};

interface BrandsModalHeaderProps {
  onSelectBrand: (guid: string) => void;
  currentBrandModalStep: BrandModalSteps;
}

export default function BrandsModalHeader({
  onSelectBrand,
  currentBrandModalStep,
}: BrandsModalHeaderProps) {
  switch (currentBrandModalStep) {
    case BrandModalSteps.SELECT_BRAND:
      return <SelectBrandHeader onSelectBrand={onSelectBrand} />;
    case BrandModalSteps.REVIEW_BRAND:
      return <ReviewBrandHeader />;
    case BrandModalSteps.FONT_LIBRARY:
    case BrandModalSteps.FOOTAGE_LIBRARY:
    case BrandModalSteps.IMAGE_LIBRARY:
      return <AssetLibraryHeader />;
    case BrandModalSteps.STOCK_IMAGE_LIBRARY:
      return <StockImageLibraryHeader />;
    case BrandModalSteps.STOCK_FOOTAGE_LIBRARY:
      return <StockFootageLibraryHeader />;
    case BrandModalSteps.LOADING_BRAND:
      return <LoadingBrandHeader />;
    default:
      return <EmptyBrandHeader />;
  }
}
