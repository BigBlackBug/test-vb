// Vendor
import { WaymarkButton } from 'shared/components/WaymarkButton';

// Local
import { BrandModalSteps } from './state/flow';
import { ModalFooterSection } from '@libs/shared-ui-components/src';

const ReviewBrandFooter = ({ onApplyBrand }: { onApplyBrand: () => void }) => (
  <ModalFooterSection>
    <WaymarkButton style={{ width: '100%' }} onClick={() => onApplyBrand()} colorTheme="Primary">
      Apply
    </WaymarkButton>
  </ModalFooterSection>
);

interface BrandsModalFooterProps {
  onApplyBrand: () => void;
  onSelectBrand: (guid: string) => void;
  currentBrandModalStep: BrandModalSteps;
}

export default function BrandsModalFooter({
  onApplyBrand,
  currentBrandModalStep,
}: BrandsModalFooterProps) {
  switch (currentBrandModalStep) {
    case BrandModalSteps.REVIEW_BRAND:
      return <ReviewBrandFooter onApplyBrand={onApplyBrand} />;
    default:
      return null;
  }
}
