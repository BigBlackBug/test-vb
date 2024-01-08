import { ChildFrameAPI } from '@libs/waymark-sdk';

import { goToInternalURL } from 'app/utils/urls';
import { appURLs } from 'app/constants/urls';

import { SDKStore } from '../types';
import { setBrandSearchURL, submitBrandSearch } from 'app/state/brandSearchStore';

export const getWaymarkMethods = (
  get: () => SDKStore,
): Pick<ChildFrameAPI, 'openWaymark' | 'close'> => ({
  openWaymark: async (options) => {
    if (options) {
      // We used to support passing in a business name and city to auto-kick off a brand search, but this is deprecated
      // now that we have replaced that with a URL-based search. We'll log a warning if these options are passed in.
      if (options.hasOwnProperty('businessCity') || options.hasOwnProperty('businessName')) {
        console.warn(
          "Warning: 'businessCity' and 'businessName' options are deprecated. Please use 'businessURL' instead.",
        );
      }

      if (options.businessURL) {
        // If a business URL was provided, auto-kick off a brand search with the URL
        setBrandSearchURL(options.businessURL);
        submitBrandSearch(true);
      }
    }
    // Navigate to the Waymark AI page
    goToInternalURL(appURLs.ai, true);
  },
  close: async () => {
    // Close the current page by returning to the base /sdk page
    goToInternalURL(appURLs.sdkLandingPage, true);
  },
});
