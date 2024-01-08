import {
  ImageSearchQueryParameters,
  ShutterstockImageSearchImageType,
} from '@libs/shutterstock-ts/src';
import { AssetSearchResponse, Image } from 'libs/media-asset-management-ts';
import ShutterstockService from 'shared/services/ShutterstockService';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

export enum AspectRatio {
  All = 'all',
  Wide = 'wide',
  Tall = 'tall',
  Square = 'square',
}

const IMAGES_PER_PAGE = 30;

interface StockImageSearchStore {
  searchFilters: {
    aspectRatio?: AspectRatio;
    categoryId?: string;
    query: string;
  };
  images: Image[] | null;
  isSearchInProgress: boolean;
  currentPageNumber: number;
  totalAvailableImageCount: number;
  getImageSearchQueryParameters: () => ImageSearchQueryParameters;
  actions: {
    setAspectRatio: (aspectRatio: AspectRatio) => void;
    setCategoryId: (categoryId: string) => void;
    setQuery: (query: string) => void;
    reset: () => void;
    searchImages: () => Promise<AssetSearchResponse<Image> | void>;
    getNextPage: () => Promise<AssetSearchResponse<Image> | void>;
  };
}

export const useStockImageSearchStore = create<StockImageSearchStore>((set, get) => ({
  searchFilters: { query: '' },
  images: null,
  isSearchInProgress: false,
  currentPageNumber: 1,
  totalAvailableImageCount: 0,
  getImageSearchQueryParameters: () => {
    const { searchFilters, currentPageNumber } = get();

    const searchParameters: ImageSearchQueryParameters = {
      page: currentPageNumber,
      per_page: IMAGES_PER_PAGE,
      // Only search for photos. In the future, we may want to expose the ability to search
      // for vector/illustration images in the UI, but for now this is usually what people want.
      image_type: ShutterstockImageSearchImageType.Photo,
      query: searchFilters.query,
    };

    if (searchFilters.categoryId) {
      searchParameters.category = searchFilters.categoryId;
    }

    switch (searchFilters.aspectRatio) {
      case AspectRatio.Wide:
        searchParameters.aspect_ratio_min = 1.1;
        searchParameters.aspect_ratio_max = 2.5;
        break;
      case AspectRatio.Tall:
        searchParameters.aspect_ratio_min = 0.4;
        searchParameters.aspect_ratio_max = 0.9;
        break;
      case AspectRatio.Square:
        searchParameters.aspect_ratio_min = 0.9;
        searchParameters.aspect_ratio_max = 1.1;
        break;
      default:
        searchParameters.aspect_ratio_min = 0.4;
        searchParameters.aspect_ratio_max = 2.5;
    }

    return searchParameters;
  },
  actions: {
    setAspectRatio: (aspectRatio: AspectRatio) => {
      set({ searchFilters: { ...get().searchFilters, aspectRatio } });
    },
    setCategoryId: (categoryId: string) => {
      set({ searchFilters: { ...get().searchFilters, query: '', categoryId } });
    },
    setQuery: (query: string) => {
      set({ searchFilters: { aspectRatio: get().searchFilters.aspectRatio, query } });
    },
    reset: () => {
      set({
        searchFilters: { query: '' },
        images: null,
        currentPageNumber: 1,
        totalAvailableImageCount: 0,
      });
    },

    searchImages: async () => {
      set({
        images: [],
        currentPageNumber: 1,
        totalAvailableImageCount: 0,
        isSearchInProgress: true,
      });

      try {
        const searchParameters = get().getImageSearchQueryParameters();

        const imageSearchResult = await ShutterstockService.searchImages(searchParameters);

        set({
          images: imageSearchResult.assets,
          currentPageNumber: imageSearchResult.page,
          totalAvailableImageCount: imageSearchResult.total_count,
          isSearchInProgress: false,
        });
        return imageSearchResult;
      } catch (error) {
        console.error('Error submitting stock image search', error);

        set({
          images: null,
          currentPageNumber: 1,
          totalAvailableImageCount: 0,
          isSearchInProgress: false,
        });
      }
    },
    getNextPage: async () => {
      const {
        currentPageNumber,
        images: currentImages,
        totalAvailableImageCount,
        getImageSearchQueryParameters,
      } = get();

      if (currentPageNumber * IMAGES_PER_PAGE >= totalAvailableImageCount) {
        return;
      }

      set({
        // Increment the current page number
        currentPageNumber: currentPageNumber + 1,
      });

      const searchParameters = getImageSearchQueryParameters();
      const imageSearchResult = await ShutterstockService.searchImages(searchParameters);

      set({
        images: [...(currentImages ?? []), ...imageSearchResult.assets],
        currentPageNumber: imageSearchResult.page,
        totalAvailableImageCount: imageSearchResult.total_count,
      });

      return imageSearchResult;
    },
  },
}));

export const useSubmitSearchImages = () =>
  useStockImageSearchStore((state) => state.actions.searchImages);

export const useImages = () => useStockImageSearchStore((state) => state.images);

export const useTotalAvailableImageCount = () =>
  useStockImageSearchStore((state) => state.totalAvailableImageCount);
export const useCurrentPageNumber = () =>
  useStockImageSearchStore((state) => state.currentPageNumber);

export const useStockImageSearchQuery = (): [
  StockImageSearchStore['searchFilters']['query'],
  StockImageSearchStore['actions']['setQuery'],
] => {
  return useStockImageSearchStore(
    (state) => [state.searchFilters.query, state.actions.setQuery],
    shallow,
  );
};

export const useGetNextPage = () => useStockImageSearchStore((state) => state.actions.getNextPage);

export const useReset = () => useStockImageSearchStore((state) => state.actions.reset);

export const useAspectRatio = (): [
  StockImageSearchStore['searchFilters']['aspectRatio'],
  StockImageSearchStore['actions']['setAspectRatio'],
] => {
  return useStockImageSearchStore(
    (state) => [state.searchFilters.aspectRatio ?? AspectRatio.All, state.actions.setAspectRatio],
    shallow,
  );
};

export const useCategoryId = (): [
  StockImageSearchStore['searchFilters']['categoryId'],
  StockImageSearchStore['actions']['setCategoryId'],
] => {
  return useStockImageSearchStore(
    (state) => [state.searchFilters.categoryId, state.actions.setCategoryId],
    shallow,
  );
};

export const useIsSearchInProgress = () =>
  useStockImageSearchStore((state) => state.isSearchInProgress);
