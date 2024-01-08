import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

interface BrandSelectionStore {
  /**
   * The GUID of the business that is currently selected
   */
  selectedBusinessGUID: string | null;
  actions: {
    setSelectedBusinessGUID: (businessGUID: string | null) => void;
  };
}

const useBrandSelectionStore = create<BrandSelectionStore>((set) => ({
  selectedBusinessGUID: null,
  actions: {
    setSelectedBusinessGUID: (businessGUID) => {
      set({
        selectedBusinessGUID: businessGUID || null,
      });
    },
  },
}));

export const useSelectedBusinessGUID = (): [
  BrandSelectionStore['selectedBusinessGUID'],
  BrandSelectionStore['actions']['setSelectedBusinessGUID'],
] =>
  useBrandSelectionStore(
    (state) => [state.selectedBusinessGUID, state.actions.setSelectedBusinessGUID],
    shallow,
  );

export const getSelectedBusinessGUID = () => useBrandSelectionStore.getState().selectedBusinessGUID;
export const setSelectedBusinessGUID =
  useBrandSelectionStore.getState().actions.setSelectedBusinessGUID;
