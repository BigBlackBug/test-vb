import _ from 'lodash';
import { ChildFrameAPI } from '@libs/waymark-sdk';

import authOperations from 'app/state/ducks/accounts/authOperations';
import store from 'app/state/store.js';

import {
  getFormattedSDKAccountObject,
  ensureNoLoggedInUser,
  getLoggedInAccount,
  extractAPIErrorMessage,
  ensureLoggedInUser,
} from './utils';

import { SDKStore } from '../types';
import { appURLs } from 'app/constants/urls';
import { goToInternalURL } from 'app/utils/urls';
import { getAreCookiesBlocked } from 'app/utils/cookies';

/**
 * Takes the getter callback for the SDK store and returns the account methods that should be passed to the FrameTranslator constructor
 */
export const getAccountMethods = (
  get: () => SDKStore,
): Pick<
  ChildFrameAPI,
  'createAccount' | 'loginAccount' | 'logoutAccount' | 'getAccountInfo' | 'updateAccountInfo'
> => {
  return {
    createAccount: async (sdkPartnerID, signedJWT) => {
      ensureNoLoggedInUser();

      const areCookiesBlocked = await getAreCookiesBlocked();

      if (areCookiesBlocked) {
        // If cookies are blocked, we'll re-make the login request once cookies are enabled by
        // a user interaction from SDKCookiesWarningModal, if they can be enabled.
        window.addEventListener('cookies-enabled', async () => {
          try {
            await store.dispatch(authOperations.sdkAccountLogin(sdkPartnerID, signedJWT));
          } catch (error) {
            get().events.onError(
              new Error('Failed to re-login to account after cookies were enabled.'),
            );
          }
        });
      }

      try {
        const account = await store.dispatch(
          authOperations.sdkCreateAccount(sdkPartnerID, signedJWT),
        );

        return account.guid;
      } catch (error) {
        console.error(error);
        throw new Error(
          `There was a problem creating the account: ${extractAPIErrorMessage(error)}`,
        );
      }
    },
    loginAccount: async (sdkPartnerID, signedJWT) => {
      ensureNoLoggedInUser();

      const areCookiesBlocked = await getAreCookiesBlocked();

      if (areCookiesBlocked) {
        // If cookies are blocked, we'll re-make the login request once cookies are enabled by
        // a user interaction from SDKCookiesWarningModal, if they can be enabled.
        window.addEventListener('cookies-enabled', async () => {
          try {
            await store.dispatch(authOperations.sdkAccountLogin(sdkPartnerID, signedJWT));
          } catch (error) {
            get().events.onError(
              new Error('Failed to re-login to account after cookies were enabled.'),
            );
          }
        });
      }

      try {
        const account = await store.dispatch(
          authOperations.sdkAccountLogin(sdkPartnerID, signedJWT),
        );

        return getFormattedSDKAccountObject(account);
      } catch (error) {
        console.error(error);

        throw new Error(
          `There was a problem authenticating the user: ${extractAPIErrorMessage(error)}`,
        );
      }
    },
    logoutAccount: async () => {
      try {
        goToInternalURL(appURLs.sdkLandingPage, true);
        await store.dispatch(authOperations.accountLogout(null));
      } catch (error) {
        console.error(error);

        throw new Error(
          `There was a problem logging out the user: ${extractAPIErrorMessage(error)}`,
        );
      }
    },
    getAccountInfo: async () => {
      ensureLoggedInUser();
      const acccount = getLoggedInAccount();
      return getFormattedSDKAccountObject(acccount);
    },
    updateAccountInfo: async (newAccountInfo) => {
      ensureLoggedInUser();

      const currentAccountInfo = getLoggedInAccount();

      try {
        // Convert keys to snake_case
        const updateAccountPayload: Record<string, string | undefined | null> = {};

        for (const key in newAccountInfo) {
          updateAccountPayload[_.snakeCase(key)] =
            newAccountInfo[key as keyof typeof newAccountInfo];
        }

        const updatedAccount = await store.dispatch(
          authOperations.updateAccountInfo(currentAccountInfo.guid, updateAccountPayload),
        );

        return getFormattedSDKAccountObject(updatedAccount);
      } catch (error) {
        console.error(error);

        throw new Error(
          `There was a problem updating the account: ${extractAPIErrorMessage(error)}`,
        );
      }
    },
  };
};
