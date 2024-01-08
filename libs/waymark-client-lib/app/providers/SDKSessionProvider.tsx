import { createContext, useContext } from 'react';

interface SDKSessionProviderProps {
  children: React.ReactNode;
}

// Default `false` value will be returned for all pages which aren't wrapped in this provider
const IsSDKSessionContext = createContext(false);

export const useIsSDKSession = () => useContext(IsSDKSessionContext);

export default function SDKSessionProvider({ children }: SDKSessionProviderProps) {
  return <IsSDKSessionContext.Provider value={true}>{children}</IsSDKSessionContext.Provider>;
}
