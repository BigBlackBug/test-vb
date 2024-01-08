import { create } from 'zustand';

import { SDKStore } from './slices/types';
import { createWaymarkFrameTranslatorSlice } from './slices/waymarkFrameTranslator';

export const useWaymarkSDKStore = create<SDKStore>()((...args) => ({
  ...createWaymarkFrameTranslatorSlice(...args),
}));

export const getWaymarkSDKStore = () => useWaymarkSDKStore.getState();
