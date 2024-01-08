// Vendor
import { z } from 'zod';

// Libs
import { ServiceDiscoverySDK } from '@libs/service-discovery-sdk';
import { Service, WaymarkServiceAccessKey } from 'libs/shared-types';

// Shared
import RuntimeConfig from 'shared/utils/RuntimeConfig';
import { uuid } from 'shared/utils/uuid';
import { getOrCreateDefaultBusinessImageLibrary } from 'shared/api/graphql/imageLibraries/mutations';
import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from 'shared/api/graphql/businesses/mutations';
import { subscribeToBusinessCacheUpdates } from 'shared/api/graphql/businesses/cache';
import { isValidURL } from 'shared/utils/urls';
import { getBusinessDetailsByGUID } from 'shared/api/graphql/businesses/queries';

// App
import store from 'app/state/store';
import * as selectors from 'app/state/selectors/index.js';
import { getOrCreateDefaultBusinessColorLibrary } from 'app/models/colorLibraries/mutations';
import SearchPushBindings from 'app/state/ducks/businessSearch/SearchPushBindings';

export const BRAND_SEARCH_STATUS = {
  init: 'init',
  starting: 'starting',
  searching: 'searching',
  readyToUse: 'readyToUse',
  complete: 'complete',
  error: 'error',
  canceled: 'canceled',
} as const;

type BrandSearchStatus = (typeof BRAND_SEARCH_STATUS)[keyof typeof BRAND_SEARCH_STATUS];
type OnStatusChangeListener = (
  newStatus: BrandSearchStatus,
  context?: Record<string, unknown>,
) => void;

/**
 * Payload to post to the search endpoint to kick off a brand search.
 */
interface BrandSearchPayload {
  searchURL: string;
  trackingGUID: string;
  searchContext: {
    businessGUID: string;
    imageLibraryID: number;
    colorLibraryGUID: string;
    environment: string;
  };
}

/**
 * Zod types for the response payload we get from the search status endpoint
 */
const searchStatusResponseEnum = z.enum([
  'INITIAL',
  'WEBSITE_PROCESSING',
  'SUMMARIZE_BUSINESS',
  'FACEBOOK_BUSINESS_SUMMARY',
  'SAVING_BUSINESS',
  'COMPLETED',
  'FAILED',
]);

const searchStatusResponseSchema = z.object({
  searchURL: z.string(),
  trackingGUID: z.string(),
  startedAt: z.string(),
  executionID: z.string(),
  facebookID: z.string().nullable(),
  businessData: z.record(z.unknown()).optional(),
  businessName: z.string().optional(),
  imageCount: z.number().optional(),
  // Accept a generic string as well so things don't blow up if we add a new status
  searchStatus: searchStatusResponseEnum.or(z.string()),
  error: z.string().nullable(),
});

const STATUS_POLLING_INTERVALS = [
  // Poll more frequently at the beginning of the search to catch fast fails up front
  250, 500, 1000,
  // 1.75s in - the search seems like it's running and it takes a while, so slow the polling down
  // but gradually start polling more frequently as time goes on and it's likelier we're close to the end
  5000, 4500,
  // 11.25s in
  4000, 3500, 3000, 2500,
  // 24.25s in
  2000, 1500, 1000, 750,
  // 28.5s in; hopefully we're really close, so keep polling every .5s until the end
  500,
];

// List of domains that we just don't support searching for and should therefore prevent the user from submitting for a search
const UNSUPPORTED_DOMAINS = [
  'instagram.com',
  'goo.gl',
  'google.com',
  'bing.com',
  'bbb.org',
  'angieslist.com',
  'homeadvisor.com',
  'spoke.com',
  'communitywalk.com',
  'twitter.com',
  'tripadvisor.com',
  'zomato.com',
  'glassdoor.com',
  'etsy.com',
  'merchantcircle.com',
  'tiktok.com',
  'linktr.ee',
  'youtube.com',
  'youtu.be',
  'video-preview.com',
];

// List of specific domain routes that we don't support searching for and should therefore prevent the user from submitting for a search
// NOTE: We aren't blocking the entire domain, just specific routes on the domain
const UNSUPPORTED_ROUTES = {
  ['linkedin.com']: [
    // LinkedIn profile URLs
    '/in/',
  ],
  ['waymark.com']: [
    // Waymark preview URLs
    '/preview',
  ],
};

// Special error class to identify errors related to the provided URL being invalid
export class InvalidURLError extends Error {}

export class BrandSearch {
  // Max timeout that we will allow to pass before we mark the business as ready to use, regardless of
  // whether the search has completed or not or if we've actually scraped all the data we would ideally like to have.
  static MAX_TIME_TO_READY = 60000;

  accountGUID: string;
  service: Service;

  // The index of the current STATUS_POLLING_INTERVALS timeout value that we should use
  // for the next status check
  private statusCheckIntervalIndex = 0;

  status: BrandSearchStatus = BRAND_SEARCH_STATUS.init;

  searchURL: string;

  businessGUID: string | null = null;
  trackingGUID: string | null = null;

  hasAboutInfo = false;

  statusPollingTimeoutID: number | undefined = undefined;
  searchReadyTimeoutID: number | undefined = undefined;

  onStatusChangeListeners = new Set<OnStatusChangeListener>();

  cancelSearchSubscriptions: (() => void) | null = null;

  constructor(
    searchURL: string,
    options: {
      service: Service;
      accountGUID: string;
      onStatusChange?: OnStatusChangeListener;
    },
  ) {
    this.searchURL = searchURL;
    this.service = options.service;
    this.accountGUID = options.accountGUID;

    if (options.onStatusChange) {
      this.onStatusChangeListeners.add(options.onStatusChange);
    }
  }

  /**
   * Starts the brand search. Note that this promise only resolves once the search has been
   * successfully kicked off, not when the search has completed. For that, use the onReadyToUse and onComplete callbacks
   * to be notified when the search data is ready to use and when the search is complete.
   */
  async startSearch() {
    try {
      this.updateStatus(BRAND_SEARCH_STATUS.starting);

      // Create a business
      const businessResponse = await createBusiness({
        accountGuid: this.accountGUID,
      });

      this.businessGUID = businessResponse.data?.createBusiness?.createdBusiness?.guid ?? null;
      if (!this.businessGUID) {
        throw new Error(
          'Something went wrong while attempting to create a Business for brand search',
        );
      }

      // Create a business image library
      const [imageLibraryResponse, colorLibraryResponse] = await Promise.all([
        getOrCreateDefaultBusinessImageLibrary(this.businessGUID),
        getOrCreateDefaultBusinessColorLibrary(this.businessGUID),
      ]);

      const imageLibraryID = imageLibraryResponse?.imageLibrary?.pk;
      if (!imageLibraryID) {
        throw new Error(
          'Something went wrong while attempting to create a BusinessImageLibrary for brand search',
        );
      }

      const colorLibraryGUID = colorLibraryResponse?.colorLibrary?.guid;
      if (!colorLibraryGUID) {
        throw new Error(
          'Something went wrong while attempting to create a BusinessColorLibrary for brand search',
        );
      }

      this.trackingGUID = uuid();

      const searchPayload: BrandSearchPayload = {
        searchURL: this.searchURL,
        trackingGUID: this.trackingGUID,
        searchContext: {
          businessGUID: this.businessGUID,
          imageLibraryID,
          colorLibraryGUID,
          environment: RuntimeConfig.getConfig('core/environment'),
        },
      };

      const startSearchResponse = await fetch(
        new URL('/url-search', this.service.baseURL).toString(),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchPayload),
        },
      );

      if (!startSearchResponse.ok) {
        console.error(
          'Received error response when attempting to start brand search',
          startSearchResponse,
        );

        const responseJSON = await startSearchResponse.json();

        if (responseJSON?.errorCode === 'INVALID_DOMAIN') {
          // If the response has an INVALID_DOMAIN error code, that means it failed our DNS lookup validation check
          // so we can show a more specific error message to the user
          throw new InvalidURLError(
            `Sorry, we couldn't find ${this.searchURL}. Please check for typos and try again.`,
          );
        } else if (responseJSON?.errorCode === 'UNSUPPORTED_FACEBOOK_URL') {
          // If the response has an UNSUPPORTED_FACEBOOK_URL error code, that means it's
          // probably a profile page (which our Facebook app doesn't support) and we can show a
          // more specific error message to the user.
          throw new InvalidURLError(
            'Sorry, this looks like a Facebook user profile. You can use a Facebook Business Page or business website.',
          );
        }

        throw new Error(responseJSON?.error || startSearchResponse.statusText);
      }

      // Start subscriptions for business updates
      const cancelDataUpdateSubscription = SearchPushBindings.listenForBusinessDataUpdate(
        this.businessGUID,
        () => (this.hasAboutInfo = true),
      );

      // Make sure we subscribe to business updates to keep the apollo cache up to date
      const cancelBusinessCacheSubscriptions = subscribeToBusinessCacheUpdates(this.businessGUID);

      this.cancelSearchSubscriptions = () => {
        cancelDataUpdateSubscription();
        cancelBusinessCacheSubscriptions();
        this.cancelSearchSubscriptions = null;
      };

      // Wait a short amount of time before kicking off our status check loop so we have a better chance
      // of catching failed searches early
      this.statusPollingTimeoutID = window.setTimeout(this.checkStatus.bind(this), 500);

      // Update our status to indicate we're officially searching
      this.updateStatus(BRAND_SEARCH_STATUS.searching);
      // Set a timeout to mark the search as ready to use if it takes too long for business info to come in
      this.searchReadyTimeoutID = window.setTimeout(() => {
        this.updateStatus(BRAND_SEARCH_STATUS.readyToUse, {
          didTimeout: true,
        });
      }, BrandSearch.MAX_TIME_TO_READY);
    } catch (err) {
      // Delete the created business to roll back if we failed to start the search
      if (this.businessGUID) {
        deleteBusiness(this.businessGUID);
      }
      this.cancelSearch();

      clearTimeout(this.searchReadyTimeoutID);
      clearInterval(this.statusPollingTimeoutID);
      console.error(`Error searching for brand URL "${this.searchURL}"`, err);

      // Re-throw the error
      throw err;
    }
  }

  /**
   * Polls for the current status of the search.
   *
   * @param {number} [maxRetriesLeft=3]   Number of times to retry before giving up if the request for the search status endpoint fails
   */
  private async checkStatus(maxRetriesLeft = 3) {
    if (this.status === BRAND_SEARCH_STATUS.canceled) {
      return;
    }

    let statusResponse: z.infer<typeof searchStatusResponseSchema> | null = null;

    try {
      statusResponse = await fetch(
        new URL(`/search/${this.trackingGUID}`, this.service.baseURL).toString(),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
        .then((res) => res.json())
        .then((resJSON) => searchStatusResponseSchema.parseAsync(resJSON));
    } catch (err) {
      console.error('Error getting search status response', err);
      // If we failed to get a status response, retry a few times every half a second before giving up
      if (maxRetriesLeft > 0) {
        this.statusPollingTimeoutID = window.setTimeout(
          () => this.checkStatus(maxRetriesLeft - 1),
          500,
        );
      } else {
        console.error('Max retries exceeded, giving up on search status polling');
        this.updateStatus(BRAND_SEARCH_STATUS.error, { error: err as Error });

        this.cancelSearch(false);
      }

      return;
    }

    if (statusResponse?.searchStatus === searchStatusResponseEnum.Enum.COMPLETED) {
      // If the search is complete and the brand has no websiteURL, manually patch in the searchURL
      // so that we can still track the incomplete brand
      if (!statusResponse.businessData?.website) {
        updateBusiness({
          guid: this.businessGUID,
          websiteUrl: this.searchURL,
        });
      }

      this.updateStatus(BRAND_SEARCH_STATUS.complete);
      this.cancelSearch(false);
    } else if (statusResponse?.error) {
      console.error('An error occurred during brand search', statusResponse.error);
      const error = new Error(statusResponse.error);

      const businessDetails = await getBusinessDetailsByGUID(this.businessGUID);

      // If the search had an error, the brand still exists, and the brand has no websiteURL, manually patch in the searchURL
      if (
        businessDetails?.data?.businessByGuid?.guid === this.businessGUID &&
        !statusResponse.businessData?.website
      ) {
        updateBusiness({
          guid: this.businessGUID,
          websiteUrl: this.searchURL,
        });
      }

      this.updateStatus(BRAND_SEARCH_STATUS.error, {
        error,
      });
    } else if (this.status === BRAND_SEARCH_STATUS.searching && this.hasAboutInfo) {
      // If the search is still in progress but we've gotten the business' about info,
      // update that the search is ready to use
      this.updateStatus(BRAND_SEARCH_STATUS.readyToUse, {
        didTimeout: false,
      });
    } else if (this.status === BRAND_SEARCH_STATUS.init) {
      this.updateStatus(BRAND_SEARCH_STATUS.searching);
    }

    // If the search is still in progress, queue up another status check
    if (
      this.status === BRAND_SEARCH_STATUS.searching ||
      this.status === BRAND_SEARCH_STATUS.readyToUse
    ) {
      this.statusPollingTimeoutID = window.setTimeout(
        this.checkStatus.bind(this),
        STATUS_POLLING_INTERVALS[this.statusCheckIntervalIndex],
      );

      if (this.statusCheckIntervalIndex < STATUS_POLLING_INTERVALS.length) {
        this.statusCheckIntervalIndex += 1;
      }
    }
  }

  /**
   * Cancels the current search.
   */
  cancelSearch(shouldUpdateStatus = true) {
    if (shouldUpdateStatus) {
      this.updateStatus(BRAND_SEARCH_STATUS.canceled);
    }

    clearTimeout(this.searchReadyTimeoutID);
    clearTimeout(this.statusPollingTimeoutID);

    this.cancelSearchSubscriptions?.();
    this.onStatusChangeListeners.clear();
  }

  /**
   * Updates the search status and notifies any listeners of the change.
   * @param {string} newStatus - The new status
   * @param {Object} context - Optional object with any additional context, ie an error
   */
  updateStatus(newStatus: 'readyToUse', context: { didTimeout: boolean }): void;
  updateStatus(newStatus: 'error', context: { error: Error }): void;
  updateStatus(newStatus: Exclude<BrandSearchStatus, 'readyToUse' | 'error'>): void;
  updateStatus(newStatus: BrandSearchStatus, context?: Record<string, unknown>): void {
    // Bail out if the status hasn't changed
    if (this.status === newStatus) {
      return;
    }

    this.status = newStatus;
    this.onStatusChangeListeners.forEach((listener) => listener(newStatus, context));
  }
}

class BrandSearchService {
  private serviceConfiguration: Service | null = null;
  private serviceAccessKey: WaymarkServiceAccessKey | null = null;

  /**
   * Gets the BrandSearchService config
   */
  private async getServiceConfiguration() {
    const serviceAccessKey = selectors.getServiceAccessToken(store.getState());

    if (!serviceAccessKey) {
      throw new Error('Could not find service access token for BrandSearchService');
    }

    if (this.serviceAccessKey !== serviceAccessKey) {
      this.serviceAccessKey = serviceAccessKey;
      const serviceDiscovery = new ServiceDiscoverySDK(serviceAccessKey);
      this.serviceConfiguration = await serviceDiscovery.discoverService('Search');
    }

    if (!this.serviceConfiguration) {
      throw new Error('Unable to find service configuration for Search');
    }

    return this.serviceConfiguration;
  }

  /**
   * Creates a new BusinessSearch instance for a given business URL and returns it.
   * Note that this does not resolve when the search is complete, just when the search has successfully started running.
   */
  async startSearch(
    businessURL: string,
    options?: {
      /**
       * Optional callback that will be called whenever the search status changes.
       */
      onStatusChange: OnStatusChangeListener;
    },
  ) {
    const { isValid, url: parsedURL } = isValidURL(businessURL);

    const isEmail = businessURL.includes('@');

    // Do super basic non-strict validation of the URL before we kick off the search
    if (!isValid || isEmail) {
      throw new InvalidURLError(`Sorry, ${businessURL} doesn't look like a valid URL.`);
    }

    if (parsedURL) {
      // Get the URL's domain name without any subdomains
      const domainName = parsedURL.hostname.split('.').slice(-2).join('.');

      // Check if the domain name is a key in UNSUPPORTED_ROUTES and if so, check if the URL path matches any of the routes
      if (domainName && domainName in UNSUPPORTED_ROUTES) {
        const unsupportedRoutes = UNSUPPORTED_ROUTES[domainName as keyof typeof UNSUPPORTED_ROUTES];
        // Check if the URL path matches any of the unsupported routes
        const isUnsupportedRoute = unsupportedRoutes.some((route) =>
          parsedURL.pathname.startsWith(route),
        );
        if (isUnsupportedRoute) {
          throw new InvalidURLError(
            `Sorry, we can't use this page on ${domainName} right now! Please use a business website or Facebook page.`,
          );
        }
      }

      if (UNSUPPORTED_DOMAINS.includes(domainName)) {
        throw new InvalidURLError(
          `Sorry, we can't use listings on ${domainName} right now! Please use a business website or Facebook page.`,
        );
      }
    }

    console.log('Starting search for', businessURL);

    const accountGUID = selectors.getAccountGUID(store.getState());
    if (!accountGUID) {
      throw new Error('Could not find logged-in account GUID for brand search');
    }

    const serviceConfiguration = await this.getServiceConfiguration();

    const { onStatusChange } = options ?? {};

    const search = new BrandSearch(businessURL, {
      service: serviceConfiguration,
      accountGUID,
      onStatusChange,
    });

    await search.startSearch();

    return search;
  }
}

export default new BrandSearchService();
