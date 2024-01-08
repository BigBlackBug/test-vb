// Vendor
import { create } from 'zustand';

export enum BrandModalSteps {
  SELECT_BRAND = 'SELECT_BRAND',
  LOADING_BRAND = 'LOADING_BRAND',
  REVIEW_BRAND = 'REVIEW_BRAND',
  IMAGE_LIBRARY = 'IMAGE_LIBRARY',
  STOCK_IMAGE_LIBRARY = 'STOCK_IMAGE_LIBRARY',
  FOOTAGE_LIBRARY = 'FOOTAGE_LIBRARY',
  STOCK_FOOTAGE_LIBRARY = 'STOCK_FOOTAGE_LIBRARY',
  FONT_LIBRARY = 'FONT_LIBRARY',
}

interface BrandModalFlowStore {
  currentBrandModalStep: BrandModalSteps;
  setCurrentBrandModalStep: (step: BrandModalSteps) => void;
}

const useBrandSelectionStore = create<BrandModalFlowStore>((set) => ({
  currentBrandModalStep: BrandModalSteps.SELECT_BRAND,
  setCurrentBrandModalStep(step) {
    set({ currentBrandModalStep: step });
  },
}));

export const useCurrentBrandModalStep = () =>
  useBrandSelectionStore((state) => state.currentBrandModalStep);

export const setCurrentBrandModalStep = (step: BrandModalSteps) =>
  useBrandSelectionStore.getState().setCurrentBrandModalStep(step);
