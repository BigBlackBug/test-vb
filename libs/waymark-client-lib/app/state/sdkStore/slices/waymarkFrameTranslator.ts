import axios from 'axios';
import { StateCreator } from 'zustand';
import FrameTranslator from '@libs/waymark-sdk/src/FrameTranslator';

import { spectrumReachSDKThemeClass } from '@libs/shared-ui-styles';

import { UnformattedConfiguredVideo } from 'shared/api/types';
import { getSDKUserVideoByGUID } from 'shared/api/graphql/userVideos/queries';
import WaymarkAuthorWebRenderer from 'shared/WaymarkAuthorWebRenderer';

import { fanoutVideoRenderCompletedEvent } from 'app/utils/events';
import { updateAppThemeConfig } from 'app/state/appThemeStore/appThemeStore';

import { getFrameTranslatorAPIMethods } from './frameTranslatorAPI/frameTranslatorAPIMethods';
import {
  SDKEventCallbacks,
  getFrameTranslatorEventCallbacks,
} from './frameTranslatorEventCallbacks';
import { formatSDKUserVideoForSDK } from './frameTranslatorAPI/utils';
import { SDKStore } from './types';

import { setAdditionalHeader } from 'shared/api/graphql';

// Maps partner ids to theme classes to apply custom themed styling to the site
const SDK_THEME_CLASSES = {
  'spectrum-reach': spectrumReachSDKThemeClass,
};

export const sdkConnectionStates = {
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

export interface WaymarkFrameTranslatorSlice {
  frameTranslator: FrameTranslator | null;
  connectionState: (typeof sdkConnectionStates)[keyof typeof sdkConnectionStates];
  events: SDKEventCallbacks;
  actions: {
    connect: () => Promise<void>;
  };
}

export const createWaymarkFrameTranslatorSlice: StateCreator<
  SDKStore,
  [],
  [],
  WaymarkFrameTranslatorSlice
> = (set, get) => {
  return {
    frameTranslator: null,
    connectionState: sdkConnectionStates.LOADING,
    events: getFrameTranslatorEventCallbacks(get),
    actions: {
      connect: async () => {
        set({
          connectionState: sdkConnectionStates.LOADING,
        });

        let frameTranslator: FrameTranslator;

        try {
          frameTranslator = new FrameTranslator(getFrameTranslatorAPIMethods(get));
          set({
            frameTranslator,
          });
        } catch (err) {
          // We can't send an error via the frame translator because it failed to initialize,
          // so we'll just log the error and update the connection state
          console.error('An error occurred while initializing the Waymark Frame Translator:', err);
          set({
            connectionState: sdkConnectionStates.FAILED,
          });
          return;
        }

        // Check if this device does not support the Waymark Author Renderer, and if so, send an error
        if (
          WaymarkAuthorWebRenderer.analyzeSupport() === WaymarkAuthorWebRenderer.SUPPORT.UNSUPPORTED
        ) {
          const errorMessage =
            'This device does not support the features required for the video player.';
          frameTranslator.sendError('BrowserCompatibilityError', errorMessage);
          console.error('BrowserCompatibilityError:', errorMessage);
          set({
            connectionState: sdkConnectionStates.FAILED,
          });
          return;
        }

        try {
          await frameTranslator.waitForConnection();
          set({
            connectionState: sdkConnectionStates.SUCCESS,
          });

          // The partnerID is passed to the SDK as part of initialization
          let sdkPartnerID: string | null = null;
          try {
            sdkPartnerID = await frameTranslator.getPartnerID();
          } catch (err) {
            // SDK integrations on v3.1.0 or lower can't use the getPartnerID method, so we
            // need to try to extract the ID from the URL's query params
            sdkPartnerID = new URL(window.location.toString()).searchParams.get('partnerid');
          }
          if (sdkPartnerID === null) {
            console.error('Waymark failed to find valid partner ID');
            set({
              connectionState: sdkConnectionStates.FAILED,
            });
            return;
          }

          console.warn('SDK Partner ID:', sdkPartnerID);

          // Add the partner ID as a header to every axios request.
          axios.defaults.headers.common['Waymark-SDK-Partner-ID'] = sdkPartnerID;
          // Add the partner ID as a header to every Apollo request.
          setAdditionalHeader('Waymark-SDK-Partner-ID', sdkPartnerID);

          // Subscribe to video render completion events so we can forward them to the host frame
          fanoutVideoRenderCompletedEvent.subscribe(
            async (configuredVideo: UnformattedConfiguredVideo) => {
              try {
                const userVideoGUID = configuredVideo.user_video_guid;
                const response = await getSDKUserVideoByGUID(userVideoGUID, 'network-only');

                if (response?.data?.userVideoByGuid) {
                  const sdkVideo = formatSDKUserVideoForSDK(response.data.userVideoByGuid);

                  // This is useful for SDK debugging with partners.
                  console.info('Video render event:', sdkVideo);
                  frameTranslator.sendEvent('videoRendered', sdkVideo);
                }
              } catch (error) {
                console.error(
                  'Video render event error: unable to dispatch videoRendered event',
                  error,
                );
                frameTranslator.sendError(
                  'EventError',
                  `Unable to dispatch videoRendered event: ${error}`,
                );
              }
            },
          );

          // Get any editor customization options that were set via the SDK
          const editorOptions = await frameTranslator.getEditorOptions();
          // If there is a custom theme class for this partner id, use it, otherwise stick with the default waymark theme
          const themeClass =
            SDK_THEME_CLASSES[sdkPartnerID as keyof typeof SDK_THEME_CLASSES] || undefined;

          updateAppThemeConfig({
            themeClass,
            editor: editorOptions,
          });
        } catch (err) {
          console.error('An error occurred while connecting to Waymark:', err);
          set({
            connectionState: sdkConnectionStates.FAILED,
          });
        }
      },
    },
  };
};
