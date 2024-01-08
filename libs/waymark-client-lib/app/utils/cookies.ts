import { useEffect, useState } from 'react';

/**
 * Tests whether the browser is currently blocking cookies
 * This will also return true for states where cookies are blocked
 * but may be able to be requested via `document.requestStorageAccess()`
 */
export const getAreCookiesBlocked = async (): Promise<boolean> => {
  if (document.hasStorageAccess) {
    try {
      const hasStorageAccess = await document.hasStorageAccess();
      return !hasStorageAccess;
    } catch (e) {
      console.error('Failed to query document.hasStorageAccess', e);
    }
  }

  return !navigator.cookieEnabled;
};

/**
 * Hook gets the current state of whether the browser is blocking cookies and returns that
 * along with a function to request access to cookies if they are blocked.
 */
export const useCookiePermissions = (): [PermissionState | null, () => Promise<void>] => {
  const [cookiePermissions, setCookiePermissions] = useState<PermissionState | null>(null);

  const requestCookiePermissions = async () => {
    if (cookiePermissions && cookiePermissions !== 'prompt') {
      return;
    }

    try {
      await document.requestStorageAccess();
      setCookiePermissions('granted');
    } catch (e) {
      // If `requestStorageAccess` throws, it's either because the user denied access or
      // the browser auto-denied the request (this can happen in Private Safari windows)
      setCookiePermissions('denied');
    }
  };

  useEffect(() => {
    if (cookiePermissions === 'granted') {
      // Dispatch an event to notify the rest of the app that cookies have been enabled
      window.dispatchEvent(new Event('cookies-enabled'));
    }
  }, [cookiePermissions]);

  useEffect(() => {
    (async () => {
      if (document.hasStorageAccess) {
        // `document.hasStorageAccess` will return true if the frame has access to cookies, false if not.
        // If false, we can still give it a shot with `document.requestStorageAccess`
        try {
          const hasStorageAccess = await document.hasStorageAccess();
          setCookiePermissions(hasStorageAccess ? 'granted' : 'prompt');
          return;
        } catch (e) {
          console.error('Failed to query document.hasStorageAccess', e);
        }
      }

      if (navigator.cookieEnabled === false) {
        // If all else fails, we can do the most basic check of testing whether cookies are enabled.
        // If not, we'll set the cookiePermissions to 'denied' because there isn't any API we can use to request
        // access at this point.
        setCookiePermissions('denied');
      } else {
        setCookiePermissions('granted');
      }
    })();
  }, []);

  return [cookiePermissions, requestCookiePermissions];
};
