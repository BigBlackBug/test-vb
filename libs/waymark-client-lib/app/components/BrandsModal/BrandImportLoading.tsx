// Vendor
import { useEffect } from 'react';

// Shared
import AIProgressBar from 'shared/components/AIProgressBar';
import { BRAND_SEARCH_STATUS } from 'shared/services/BrandSearchService';

// App
import { useBrandSearchStatus, SEARCH_READY_TIMEOUT } from 'app/state/brandSearchStore';
import { BrandModalSteps, setCurrentBrandModalStep } from './state/flow';

// Local
import { ProgressBar } from './BrandImportLoading.css';

export default function BrandImportLoading() {
  const brandSearchStatus = useBrandSearchStatus();

  useEffect(() => {
    switch (brandSearchStatus) {
      case BRAND_SEARCH_STATUS.readyToUse:
      case BRAND_SEARCH_STATUS.complete:
        // If the brand search is ready, wait long enough for the loading bar to animate to full, then proceed to the next step
        const timeoutID = setTimeout(() => {
          setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
        }, 300);
        return () => clearTimeout(timeoutID);
      case BRAND_SEARCH_STATUS.error:
      case BRAND_SEARCH_STATUS.canceled:
        // If the search failed or was canceled, just go to the next step immediately
        setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
        break;
      case BRAND_SEARCH_STATUS.init:
        // If the search was reset to the initial state, go back to the brand selection step; this is probably
        // an indicator that the search failed to start
        setCurrentBrandModalStep(BrandModalSteps.SELECT_BRAND);
        break;
      default:
    }
  }, [brandSearchStatus]);

  const isReady =
    brandSearchStatus === BRAND_SEARCH_STATUS.readyToUse ||
    brandSearchStatus === BRAND_SEARCH_STATUS.complete;

  return (
    <AIProgressBar
      progress={isReady ? 1 : null}
      autoIncrementProgressDuration={SEARCH_READY_TIMEOUT}
      className={ProgressBar}
    />
  );
}
