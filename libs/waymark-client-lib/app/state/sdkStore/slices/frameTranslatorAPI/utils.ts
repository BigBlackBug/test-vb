import {
  AccountInfo,
  AccountMustBeAuthenticatedError,
  ExistingLoginError,
  VideoData,
} from '@libs/waymark-sdk';

import store from 'app/state/store.js';
import * as selectors from 'app/state/selectors/index.js';

import { UnformattedAccount, UnformattedUserVideo } from 'shared/api/types';
import { SDKUserVideo } from 'shared/api/graphql/userVideos/queries';
import { EditorUserVideo } from 'editor/types/userVideo';

export const getFormattedSDKAccountObject = (account: UnformattedAccount): AccountInfo => ({
  id: account.guid,
  externalID: account.external_id,
  createdAt: account.created_at,
  updatedAt: account.updated_at,
  firstName: account.first_name,
  lastName: account.last_name,
  emailAddress: account.email_address,
  companyName: account.company_name,
  phone: account.phone,
  city: account.city,
  state: account.state,
});

const isEditorVideo = (video: UnformattedUserVideo | EditorUserVideo): video is EditorUserVideo =>
  video.hasOwnProperty('createdAt');

const formatUnformattedUserVideoForSDK = (userVideo: UnformattedUserVideo): VideoData => ({
  id: userVideo.guid,
  createdAt: userVideo.created_at,
  updatedAt: userVideo.updated_at,
  isPurchased: Boolean(userVideo.purchased_at),
  name: userVideo.title,
  templateID: userVideo.video_template_variant,
  renders: [],
});

const formatEditorUserVideoForSDK = (userVideo: EditorUserVideo): VideoData => ({
  id: userVideo.guid,
  createdAt: userVideo.createdAt,
  updatedAt: userVideo.updatedAt,
  isPurchased: userVideo.isPurchased,
  name: userVideo.videoTitle,
  templateID: userVideo.variantGUID,
  renders: [],
});

export const formatUnformattedUserVideoOrEditorUserVideoForSDK = (
  userVideo: UnformattedUserVideo | EditorUserVideo,
) =>
  isEditorVideo(userVideo)
    ? formatEditorUserVideoForSDK(userVideo)
    : formatUnformattedUserVideoForSDK(userVideo);

export const formatSDKUserVideoForSDK = (userVideo: SDKUserVideo): VideoData => ({
  id: userVideo.guid as string,
  createdAt: userVideo.createdAt,
  updatedAt: userVideo.updatedAt,
  isPurchased: Boolean(userVideo.purchasedAt),
  name: userVideo.title,
  templateID: userVideo.videoTemplateVariant.guid as string,
  renders:
    userVideo.currentConfiguredVideo?.renderedVideos?.edges
      .filter(({ node: renderedVideo }) => renderedVideo.renderFormat !== 'preview')
      .map(({ node: renderedVideo }) => ({
        renderedAt: renderedVideo.renderedAt as string,
        format: renderedVideo.renderFormat as Exclude<typeof renderedVideo.renderFormat, 'preview'>,
        status: renderedVideo.renderStatus,
        url: renderedVideo.renderUrl as string,
      })) ?? [],
});

export const extractAPIErrorMessage = (error: any) => {
  if (!error) {
    return 'unknown error';
  }

  if (typeof error === 'object') {
    if (error['fieldErrors']) {
      const fieldErrorKeys = Object.keys(error['fieldErrors']);
      if (fieldErrorKeys.length > 0) {
        return fieldErrorKeys
          .map((errorKey) => `(${errorKey}) ${error['fieldErrors'][errorKey]}`)
          .join(', ');
      }
    }

    if (error['errorMessage']) {
      return error['errorMessage'];
    }

    if (error['statusCode'] === 500) {
      return 'internal server error';
    }
  }

  return 'unknown error';
};

/**
 * Throw an error if a user tries to login or create an account if there is already a logged in user.
 */
export const ensureNoLoggedInUser = () => {
  if (selectors.isLoggedIn(store.getState())) {
    throw new ExistingLoginError('Another user is already logged in.');
  }
};

/**
 * Throw an error if a user tries to do something that requires an account but is not logged in.
 */
export const ensureLoggedInUser = () => {
  if (!selectors.isLoggedIn(store.getState())) {
    throw new AccountMustBeAuthenticatedError('An account has not yet been authenticated.');
  }
};

/**
 * Get the currently logged-in account.
 */
export const getLoggedInAccount = () => {
  return selectors.getAccount(store.getState());
};
