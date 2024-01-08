import { appURLs, queryParams } from 'app/constants/urls';
import { goToInternalURL } from 'app/utils/urls';

import { EditorUserVideo } from 'editor/types/userVideo';
import { UnformattedUserVideo } from 'shared/api/types';
import { SDKUserVideo } from 'shared/api/graphql/userVideos/queries';

import {
  formatSDKUserVideoForSDK,
  formatUnformattedUserVideoOrEditorUserVideoForSDK,
} from './frameTranslatorAPI/utils';
import { SDKStore } from './types';
export interface SDKEventCallbacks {
  /**
   * Called when the Waymark AI page has been opened successfully
   */
  onWaymarkOpened: () => void;
  /**
   * Called when the Waymark AI page fails to open
   */
  onWaymarkOpenFailed: (error: Error) => void;
  /**
   * Called when the editor has been opened successfully, either directly or
   * via the "Edit" button in the AI flow
   */
  onEditorOpened: (openedUserVideo: EditorUserVideo) => void;
  /**
   * Called when the editor fails to open
   */
  onEditorOpenFailed: (error: Error) => void;
  /**
   * Called when the user clicks the exit button to close the editor
   */
  onCloseEditor: () => void;
  /**
   * Called when the editor has been closed
   */
  onEditorExited: () => void;
  /**
   * Called when the user saves a new video to their account
   */
  onVideoCreated: (userVideoData: UnformattedUserVideo | EditorUserVideo) => void;
  /**
   * Called when the user saves a video for the first time or saves new changes
   * to an existing video
   */
  onVideoSaved: (userVideoData: UnformattedUserVideo | EditorUserVideo) => void;
  /**
   * Called when the user has "completed" (our term for purchasing in the SDK) the video in the editor
   */
  onVideoCompleted: (userVideoData: SDKUserVideo) => void;
  /**
   * Called when an error is thrown which is worth surfacing to SDK consumers
   */
  onError: (error: Error) => void;
}

export const getFrameTranslatorEventCallbacks = (get: () => SDKStore): SDKEventCallbacks => ({
  onWaymarkOpened: () => {
    get().frameTranslator?.sendEvent('waymarkOpened', undefined);
  },
  onWaymarkOpenFailed: (error) => {
    const {
      frameTranslator,
      events: { onError },
    } = get();

    frameTranslator?.sendEvent('waymarkOpenFailed', error);
    // Send a generic error event as well
    onError(error);
  },
  onEditorOpened: (openedUserVideo) => {
    const videoData = formatUnformattedUserVideoOrEditorUserVideoForSDK(openedUserVideo);
    console.log('CLIENT videoData', videoData);
    get().frameTranslator?.sendEvent('editorOpened', videoData);
  },
  onEditorOpenFailed: (error) => {
    const {
      frameTranslator,
      events: { onError },
    } = get();

    frameTranslator?.sendEvent('editorOpenFailed', error);
    // Send a generic error event as well
    onError(error);
  },
  onCloseEditor: () => {
    const currentSearchParams = new URLSearchParams(window.location.search);

    if (currentSearchParams.has(queryParams.sdkShouldCloseOnEditorExit)) {
      // If the SDK should close when the editor exits, navigate back to the SDK landing page
      goToInternalURL(appURLs.sdkLandingPage, true);
    } else {
      // Otherwise, navigate back to the WAI page
      goToInternalURL(appURLs.ai, true);
    }
  },
  onEditorExited: () => {
    get().frameTranslator?.sendEvent('editorExited', undefined);
  },
  onVideoCreated: (userVideoData) => {
    const translator = get().frameTranslator;

    if (!translator) {
      return;
    }

    const formattedSDKVideo = formatUnformattedUserVideoOrEditorUserVideoForSDK(userVideoData);
    translator?.sendEvent('videoCreated', formattedSDKVideo);
    // Emit a videoSaved event as well
    translator?.sendEvent('videoSaved', formattedSDKVideo);
  },
  onVideoSaved: (userVideoData) => {
    const translator = get().frameTranslator;

    if (!translator) {
      return;
    }

    const formattedSDKVideo = formatUnformattedUserVideoOrEditorUserVideoForSDK(userVideoData);
    translator.sendEvent('videoSaved', formattedSDKVideo);
  },
  onVideoCompleted: (userVideoData) => {
    get().frameTranslator?.sendEvent('videoCompleted', formatSDKUserVideoForSDK(userVideoData));
    // Return to the SDK landing page to close the editor
    goToInternalURL(appURLs.sdkLandingPage, true);
  },
  onError: (error) => {
    get().frameTranslator?.sendError(error.name, error.message);
  },
});
