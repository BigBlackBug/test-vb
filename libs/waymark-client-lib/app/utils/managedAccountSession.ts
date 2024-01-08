// Vendor
import _ from 'lodash';

// Local
import { goToExternalURL, parseQueryParams } from 'shared/utils/urls.js';
import { safeSessionStorage } from 'shared/utils/safeStorage';
import { sessionStorageKeys } from 'app/constants/SessionStorage';
import { queryParams } from 'app/constants/urls.js';

/**
 * Looks at query parameters, values stored in sessionStorage, and the account
 * returned by the server at app startup to determine if this is a managed
 * account session or a regular user session. Function will remove query params
 * and reload the page if a mismatch between the attempted URL and server
 * decision is detected.
 *
 * @param {string}  selectedAccountGUID  The account GUID returned by the
 *                                         server for this session.
 */
export const setManagedAccountSessionData = (selectedAccountGUID: string) => {
  const queryParameters = parseQueryParams();
  const adminOverrideQueryParamValue = queryParameters[queryParams.adminOverrideAccountGUID];
  const adminOverrideSessionStorageValue = safeSessionStorage.getItem(
    sessionStorageKeys.adminOverrideAccountGUID,
  );

  if (selectedAccountGUID) {
    // We should return to our normally scheduled programming if:
    // - The user was not attempting to start a managed account session.
    // - The user was attempting to start a managed account session, but they
    // were not logged in. The login code will take care of the rest.
    if (!adminOverrideQueryParamValue && !adminOverrideSessionStorageValue) {
      return;
    }

    // If there was no admin override in the URL, but there is one stored in session
    // storage, add the correct query parameter to the URL and refresh the page.
    if (!adminOverrideQueryParamValue) {
      goToExternalURL(window.location.pathname, {
        ...queryParameters,
        [queryParams.adminOverrideAccountGUID]: adminOverrideSessionStorageValue,
      });
    } else if (adminOverrideQueryParamValue !== selectedAccountGUID) {
      // If the user was attempting to start a managed account session, but the server
      // determined they didn't have the correct permissions, remove the query parameter
      // and refresh the page.
      goToExternalURL(
        window.location.pathname,
        _.omit(queryParameters, queryParams.adminOverrideAccountGUID),
      );

      // This likely hasn't been set by now, but if the user copy/pasted a URL for an
      // account they don't have permissions to manage in a tab where they had been
      // successfully managing other accounts, this value will be set for one of those.
      safeSessionStorage.removeItem(sessionStorageKeys.adminOverrideAccountGUID);
    } else {
      // After all that, if no other action was taken, we've determined:
      // - A user was logged in when the request was made.
      // - The user was attempting to start a managed account session.
      // - The user has permissions to manage the requested account.
      safeSessionStorage.setItem(
        sessionStorageKeys.adminOverrideAccountGUID,
        adminOverrideQueryParamValue,
      );
    }
  }
};
