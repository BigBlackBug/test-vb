// Local
import { CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import { ColorLibrary, ColorLibraryColor } from 'shared/api/graphql/colorLibraries/fragments';
import { ImageLibrary, ImageLibraryImage } from 'shared/api/graphql/imageLibraries/fragments';
import PushService from 'shared/services/PushService.js';

// Payloads don't have __typename; we'll need to fill these in ourselves
export type BusinessDataUpdatePayload = Partial<CoreBusinessDetails> &
  Pick<CoreBusinessDetails, 'id' | 'guid' | 'pk'> &
  Partial<
    Pick<
      CoreBusinessDetails,
      | 'businessName'
      | 'contactPhone'
      | 'streetAddress1'
      | 'city'
      | 'state'
      | 'postalCode'
      | 'businessAbout'
      | 'industryName'
      | 'websiteUrl'
    >
  >;

export type CreatedBusinessColor = Omit<ColorLibraryColor, '__typename'> & {
  colorLibrary: Pick<ColorLibrary, 'id' | 'guid'>;
};

export interface BusinessColorsCreatedPayload {
  businessGuid: string;
  colors: CreatedBusinessColor[];
}

export type CreatedBusinessImage = Omit<ImageLibraryImage, '__typename'> & {
  imageLibrary: Pick<ImageLibrary, 'id' | 'pk'>;
};

export interface BusinessImagesCreatedPayload {
  businessGuid: string;
  images: CreatedBusinessImage[];
}

export interface EnhancedImagePayload {
  data: {
    enhanced_image_url: string;
  };
}

export const isEnhancedImage = (imagePayload: unknown): imagePayload is EnhancedImagePayload =>
  (imagePayload as EnhancedImagePayload)?.data?.enhanced_image_url !== undefined;

/**
 * A singleton that listens to Fanout for SearchResultGroups and their assets.
 */
class SearchPushBindings {
  subscriptions = new Map<
    string,
    {
      // Listeners map tracks all listeners and the number of places which that each listener is in use
      // This is relevant for cases where we may be using the same listener in multiple places, ie
      // keeping a subscription active for keeping the apollo cache up to date with business changes
      listeners: Map<(payload: unknown) => void, number>;
      fayeSubscription: {
        // We don't have a proper type for Faye.Subscription
        cancel: () => void;
      };
    }
  >();

  /**
   * Adds a listener for a given subscription channel. If the channel doesn't exist yet,
   * we'll set up a new subscription and add the listener to that.
   *
   * @param {string} subscriptionChannel - The channel to subscribe to.
   * @param {Function} subscriptionCallback - The listener callback to add for the channel.
   * @returns Function to remove the listener
   */
  addSubscriptionListener(
    subscriptionChannel: string,
    subscriptionCallback: (payload: any) => void,
  ) {
    let subscription = this.subscriptions.get(subscriptionChannel);

    if (!subscription) {
      const fayeSubscription = PushService.subscribe(subscriptionChannel, (payload: string) => {
        const listeners = this.subscriptions.get(subscriptionChannel)?.listeners;
        if (listeners) {
          for (const listener of listeners.keys()) {
            listener(JSON.parse(payload));
          }
        }
      });

      subscription = {
        listeners: new Map(),
        fayeSubscription,
      };

      subscription.listeners.set(subscriptionCallback, 0);

      this.subscriptions.set(subscriptionChannel, subscription);
    }

    const listenerCount = subscription.listeners.get(subscriptionCallback) ?? 0;
    subscription.listeners.set(subscriptionCallback, listenerCount + 1);

    return () => {
      console.log('Cancelling subscription listener for channel', subscriptionChannel);
      const { fayeSubscription, listeners } = subscription || {};
      if (listeners) {
        const listenerCount = listeners.get(subscriptionCallback);

        if (listenerCount && listenerCount > 1) {
          listeners.set(subscriptionCallback, listenerCount - 1);
          return;
        } else {
          listeners.delete(subscriptionCallback);

          if (listeners.size === 0) {
            fayeSubscription?.cancel();
            this.subscriptions.delete(subscriptionChannel);
          }
        }
      }
    };
  }

  /**
   * Subscribe to new business images as they roll in for the business. This can also include AI-enhanced images.
   * Payloads may either be an array of new business images or a single new enhanced image, so you will need handling for both possibilities.
   *
   * @param {string} businessGUID - The GUID of the business we're listening for.
   * @param {function} onReceiveBusinessImages - The function to call with the message payload.
   */
  listenForBusinessImages(
    businessGUID: string,
    onReceiveBusinessImages: (
      createdBusinessImages: BusinessImagesCreatedPayload | EnhancedImagePayload,
    ) => void,
  ) {
    const businessImagesChannel = `/${businessGUID}/business/images/created`;
    return this.addSubscriptionListener(businessImagesChannel, onReceiveBusinessImages);
  }

  /**
   * Subscribe to receive Fanout messages when colors libraries are updated for the provided business during search.
   * Color data can be returned with images and the libraries are updated (temporarily) on the server.
   *
   * @param {string} businessGUID - GUID of the business to listen to updates for
   * @param {func} onBusinessColorsUpdated - Callback invoked when message received
   *
   * @returns Function to cancel Fanout subscription
   */
  listenForBusinessColors(
    businessGUID: string,
    onBusinessColorsUpdated: (createdBusinessColors: BusinessColorsCreatedPayload) => void,
  ) {
    const businessColorsChannel = `/${businessGUID}/business/colors/created`;
    return this.addSubscriptionListener(businessColorsChannel, onBusinessColorsUpdated);
  }

  /**
   * Subscribe to receive Fanout messages when the business data is updated.
   *
   * @param {string} businessGUID - GUID of the business to listen to updates for
   * @param {func} onBusinessDataUpdate - Callback invoked when message received
   *
   * @returns Function to cancel Fanout subscription
   */
  listenForBusinessDataUpdate(
    businessGUID: string,
    onBusinessDataUpdate: (updatedBusinessData: BusinessDataUpdatePayload) => void,
  ) {
    const businessDataUpdatedChannel = `/${businessGUID}/business/updated`;
    return this.addSubscriptionListener(businessDataUpdatedChannel, onBusinessDataUpdate);
  }

  /**
   * Clear all existing subscriptions.
   */
  cancelExistingSubscriptions() {
    this.subscriptions.forEach(({ fayeSubscription, listeners: callbacks }) => {
      fayeSubscription?.cancel();
      callbacks.clear();
    });
    this.subscriptions.clear();
  }
}

export default new SearchPushBindings();
