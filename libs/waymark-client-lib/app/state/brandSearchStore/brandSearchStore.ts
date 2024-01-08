import { create } from 'zustand';

import BrandSearchService, {
  BrandSearch,
  InvalidURLError,
  BRAND_SEARCH_STATUS,
} from 'shared/services/BrandSearchService';
import { shallow } from 'zustand/shallow';
import { setSelectedBusinessGUID } from '../brandSelectionStore';
import { createBusiness } from 'shared/api/graphql/businesses/mutations';

import store from 'app/state/store';
import * as selectors from 'app/state/selectors/index.js';
import { CreateBusinessMutationInput } from '@libs/graphql-types/src';
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';

export const SEARCH_READY_TIMEOUT = BrandSearch.MAX_TIME_TO_READY;

interface BrandSearchStore {
  brandSearchURL: string;
  errorMessage: string | null;
  brandSearch: BrandSearch | null;
  searchStatus: (typeof BRAND_SEARCH_STATUS)[keyof typeof BRAND_SEARCH_STATUS];
  actions: {
    setBrandSearchURL: (brandSearchURL: string) => void;
    /**
     * Cancels the current active brandSearch (if applicable) and resets the current search status to init
     */
    clearCurrentSearch: () => void;
    /**
     * Starts a brand search and returns the created BrandSearch instance which will manage performing the search.
     * @param {boolean} [shouldSelectCreatedBusiness=false] If true, the brandSelectionStore will be updated to select
     *                                                      the business created by the search.
     *                                                      We usually want this behavior in the AI flow, but not the editor;
     *                                                      in the editor, you don't want to overwrite the business that's currently applied to the
     *                                                      video until the user opts into that by running a new video generation with that new business.
     */
    submitBrandSearch: (shouldSelectCreatedBusiness?: boolean) => Promise<BrandSearch | null>;
    /**
     * Creates a blank fallback Business which the user can use if they're unable to perform a brand search.
     *
     * @param {Object} [initialBusinessData] Optional initial data to save for the business, if any is available. Otherwise, the business will be created with no data.
     * @param {boolean} [shouldSelectCreatedBusiness=false] If true, the brandSelectionStore will be updated to select the created business.
     */
    createFallbackBusiness: (
      initialBusinessData?: Omit<CreateBusinessMutationInput, 'accountGuid'> | null,
      shouldSelectCreatedBusiness?: boolean,
    ) => Promise<CoreBusinessDetails | null>;
    /**
     * Clears the current brand search and the search URL.
     */
    reset: () => void;
  };
}

const useBrandSearchStore = create<BrandSearchStore>((set, get) => ({
  brandSearchURL: '',
  errorMessage: null,
  brandSearch: null,
  searchStatus: BRAND_SEARCH_STATUS.init,
  actions: {
    setBrandSearchURL: (brandSearchURL) => set({ brandSearchURL, errorMessage: null }),
    clearCurrentSearch: () => {
      const { brandSearch: currentBrandSearch } = get();
      // If we have a current search, cancel it
      currentBrandSearch?.cancelSearch();

      set({
        brandSearch: null,
        searchStatus: BRAND_SEARCH_STATUS.init,
      });
    },
    submitBrandSearch: async (shouldSelectCreatedBusiness = false) => {
      const { brandSearchURL, actions } = get();

      actions.clearCurrentSearch();

      set({
        searchStatus: BRAND_SEARCH_STATUS.starting,
        errorMessage: null,
      });

      let search: BrandSearch;

      try {
        // We're declaring search before assigning to it avoid potential issues with referencing `search` in the event callbacks
        // before it's been properly initialized.
        search = await BrandSearchService.startSearch(brandSearchURL, {
          onStatusChange(newStatus) {
            set({
              searchStatus: newStatus,
            });
          },
        });

        set({
          brandSearch: search,
        });

        if (shouldSelectCreatedBusiness && search?.businessGUID) {
          setSelectedBusinessGUID(search.businessGUID);
        }

        return search;
      } catch (e) {
        console.error('An error occurred while attempting to start a brand search.', e);
        const invalidURLMessage = e instanceof InvalidURLError ? e.message : null;

        actions.clearCurrentSearch();

        set({
          searchStatus: BRAND_SEARCH_STATUS.error,
          errorMessage:
            invalidURLMessage ||
            "We're sorry, something went wrong while searching for your business.",
        });
      }

      return null;
    },
    createFallbackBusiness: async (
      initialBusinessData = null,
      shouldSelectCreatedBusiness = false,
    ) => {
      try {
        const accountGUID = selectors.getAccountGUID(store.getState());
        const response = await createBusiness({
          accountGuid: accountGUID,
          ...(initialBusinessData || {}),
        });

        const createdBusiness = response.data?.createBusiness?.createdBusiness;

        if (createdBusiness) {
          if (shouldSelectCreatedBusiness) {
            setSelectedBusinessGUID(createdBusiness.guid || null);
          }

          return createdBusiness;
        } else {
          throw new Error(response.errors?.join('\n') || 'An unknown error occurred.');
        }
      } catch (e) {
        console.error('An error occurred while attempting to create a fallback business.', e);
      }

      return null;
    },
    reset: () => {
      get().actions.clearCurrentSearch();

      set({
        // Also clear the search URL
        brandSearchURL: '',
      });
    },
  },
}));

export const useBrandSearchURL = (): [
  BrandSearchStore['brandSearchURL'],
  BrandSearchStore['actions']['setBrandSearchURL'],
] =>
  useBrandSearchStore((state) => [state.brandSearchURL, state.actions.setBrandSearchURL], shallow);

export const useSubmitBrandSearch = () =>
  useBrandSearchStore((state) => state.actions.submitBrandSearch);
export const useBrandSearchStatus = () => useBrandSearchStore((state) => state.searchStatus);

export const useErrorMessage = () => useBrandSearchStore((state) => state.errorMessage);

export const useResetBrandSearch = () => useBrandSearchStore((state) => state.actions.reset);

export const useCreateFallbackBusiness = () =>
  useBrandSearchStore((state) => state.actions.createFallbackBusiness);

export const useCurrentBrandSearch = () => useBrandSearchStore((state) => state.brandSearch);
export const useCurrentBrandSearchBusinessGUID = () =>
  useCurrentBrandSearch()?.businessGUID || null;

/**
 * Hook returns the URL which is currently actively being searched for (or null if no search is in progress)
 */
export const useActiveBrandSearchURL = () =>
  useBrandSearchStore((state) => state.brandSearch?.searchURL || state.brandSearchURL || null);

export const setBrandSearchURL = useBrandSearchStore.getState().actions.setBrandSearchURL;
export const submitBrandSearch = useBrandSearchStore.getState().actions.submitBrandSearch;
