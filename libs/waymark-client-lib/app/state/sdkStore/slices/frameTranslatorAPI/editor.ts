import store from 'app/state/store';
import { ChildFrameAPI } from '@libs/waymark-sdk';

import userVideoOperations from 'app/state/ducks/userVideos/operations.js';

import { goToInternalURL } from 'app/utils/urls';
import { appURLs, queryParams } from 'app/constants/urls';
import { parsePersistentQueryParamsForInternalURL } from 'shared/utils/urls';

import { SDKStore } from '../types';

export const getEditorMethods = (
  get: () => SDKStore,
): Pick<ChildFrameAPI, 'openEditorForVideo'> => ({
  /**
   * Opens the editor page for a given user video
   *
   * @param {string} videoID   GUID for the user video we want to load
   * @param {boolean} shouldNavigateBackOnExit   Whether or not to navigate back to the /ai page when the editor is closed
   */
  openEditorForVideo: async (videoID, shouldNavigateBackOnExit) => {
    const userVideo = await store.dispatch(userVideoOperations.loadUserVideo(videoID));

    if (!userVideo || userVideo.isError) {
      const frameTranslator = get().frameTranslator;
      // If the user video failed to load, emit an event indicating that the editor failed to open
      frameTranslator?.sendEvent(
        'editorOpenFailed',
        new Error(`Failed to load video with id "${videoID}"`),
      );
    } else {
      const urlParams = parsePersistentQueryParamsForInternalURL();
      if (!shouldNavigateBackOnExit) {
        // Add a query param to indicate that the SDK session should close when the user exits the editor
        urlParams[queryParams.sdkShouldCloseOnEditorExit] = 'true';
      }

      // Navigate to the editor!
      goToInternalURL(appURLs.editYourVideo(videoID), true, urlParams);
    }
  },
});
