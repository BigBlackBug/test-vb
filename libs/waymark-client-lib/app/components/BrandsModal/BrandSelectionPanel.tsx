// Vendor
import { useCallback } from 'react';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';

// Shared
import { RotatingLoader } from '@libs/shared-ui-components/src';
import { useAllBusinessesForAccount } from 'shared/api/graphql/businesses/queries';
import { BRAND_SEARCH_STATUS } from 'shared/services/BrandSearchService';

// App
import {
  LoginCancelledError,
  useAttemptLoginProtectedAction,
} from 'app/providers/LoginProtectedActionModalProvider';
import {
  useBrandSearchStatus,
  useBrandSearchURL,
  useErrorMessage,
  useSubmitBrandSearch,
} from 'app/state/brandSearchStore';

// Editor
import BusinessProfileInfoCard from 'editor/components/BusinessProfileInfoCard';

// Local
import * as styles from './BrandSelectionPanel.css';
import { Form, FormSubmitButton } from '../AI1XPage/shared/FormElements';
import { BrandModalSteps, setCurrentBrandModalStep } from './state/flow';

interface BrandSelectionPanelProps {
  currentSelectedBusinessGUID: string | null;
  onSelectBrand: (businessGUID: string) => void;
}

export function BrandSelectionPanel({
  currentSelectedBusinessGUID,
  onSelectBrand,
}: BrandSelectionPanelProps) {
  const { businesses, isLoading: isLoadingBusinesses } = useAllBusinessesForAccount();

  const [searchURL, setSearchURL] = useBrandSearchURL();
  const submitBrandSearch = useSubmitBrandSearch();
  const brandSearchStatus = useBrandSearchStatus();
  const searchErrorMessage = useErrorMessage();

  const isSearchInProgress =
    brandSearchStatus === BRAND_SEARCH_STATUS.starting ||
    brandSearchStatus === BRAND_SEARCH_STATUS.searching;

  const canSubmitSearch = Boolean(searchURL) && !isSearchInProgress;

  const attemptLoginProtectedAction = useAttemptLoginProtectedAction();

  const onSubmitBrandSearch = useCallback(
    async (event) => {
      event.preventDefault();

      if (!canSubmitSearch) {
        return;
      }

      try {
        // If the user is not logged in, open a login modal before proceeding with
        // the brand search.
        const createdSearch = await attemptLoginProtectedAction(() => submitBrandSearch(true));
        // submitBrandSearch returns null if the search submission failed, but if it succeeded we'll
        // proceed to the loading step
        if (createdSearch) {
          setCurrentBrandModalStep(BrandModalSteps.LOADING_BRAND);
        }
      } catch (e) {
        if (!(e instanceof LoginCancelledError)) {
          console.error('Something went wrong while attempting to submit brand search:', e);
        }
      }
    },
    [attemptLoginProtectedAction, canSubmitSearch, submitBrandSearch],
  );

  return (
    <>
      <Form className={styles.BrandSearchForm} onSubmit={onSubmitBrandSearch}>
        <WaymarkTextInput
          className={styles.BrandSelectionField}
          label="Enter a business website"
          placeholder="wanderlustcreamery.com"
          value={searchURL}
          onChange={(event) => setSearchURL((event.target as HTMLInputElement).value)}
          hasError={Boolean(searchErrorMessage)}
          subtext={searchErrorMessage}
        />
        <FormSubmitButton
          className={styles.BrandSelectionButton}
          isDisabled={!canSubmitSearch}
          isLoading={isSearchInProgress}
        >
          Search
        </FormSubmitButton>
      </Form>
      {!isSearchInProgress ? (
        <>
          <h2 className={styles.SectionHeader}>Saved Brands</h2>
          {isLoadingBusinesses ? (
            <RotatingLoader className={styles.loadingSpinner} />
          ) : (
            <div className={styles.savedBrandListWrapper}>
              {businesses.length === 0 && !isLoadingBusinesses ? (
                <p>
                  You haven&apos;t saved any brands yet. Search and select your business to save.
                </p>
              ) : (
                businesses.map((business) => (
                  <BusinessProfileInfoCard
                    key={business.id}
                    className={styles.savedBrandCard}
                    onClick={() => {
                      if (!business.guid) {
                        console.error(
                          'BrandSelectionPanel -> BusinessProfileInfoCard -> onClick - no business guid',
                        );
                        return;
                      }

                      onSelectBrand(business.guid);
                      setCurrentBrandModalStep(BrandModalSteps.REVIEW_BRAND);
                    }}
                    businessDetails={business}
                    thumbnailClassName={styles.brandCardThumbnail}
                    infoContainerClassName={styles.brandCardInfo}
                    isHighlighted={business.guid === currentSelectedBusinessGUID}
                  />
                ))
              )}
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
