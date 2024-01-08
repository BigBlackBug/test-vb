// Vendor
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Local
import useWindowEvent from 'app/hooks/windowEvent.js';
import * as selectors from 'app/state/selectors/index.js';
import elementIDs from 'app/constants/elementIDs.js';

import * as styles from './AccountOverrideBanner.css';

/**
 * Displays a banner fixed to the top of the page which indicates that the user is using an account override
 * in this session to access a different account from their own
 *
 * Note that this is broken out into a separate component so that our refs and hooks won't break/run needlessly if
 * the user isn't using a session override.
 */
const AccountOverrideBannerContents = () => {
  const overrideBannerRef = useRef<HTMLDivElement>(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  // Keep the banner placeholder's height up to date as the window is resized
  const onWindowResize = useCallback(() => {
    setBannerHeight(overrideBannerRef.current?.clientHeight ?? 0);
  }, []);

  useEffect(() => {
    onWindowResize();
  }, [onWindowResize]);

  useWindowEvent('resize', onWindowResize);

  const { hasFetchedAccount, accountEmail, accountName, accountCompanyName } = useSelector(
    (state) => ({
      hasFetchedAccount: selectors.hasFetchedAccount(state),
      accountEmail: selectors.getAccountEmail(state),
      accountName: selectors.getAccountName(state),
      accountCompanyName: selectors.getAccountCompanyName(state),
    }),
  );

  return (
    <>
      <div
        // Placeholder element adds height to the top of the page to ensure the fixed banner won't cover anything that it shouldn't
        style={{ height: bannerHeight }}
        className={styles.AccountOverrideBannerHeightPlaceholder}
      />
      <div
        className={styles.AccountOverrideBanner}
        // Hide the banner until the account has loaded and we are ready to display
        // info for it
        {...styles.dataIsHidden(!hasFetchedAccount)}
        ref={overrideBannerRef}
        // ID to apply to any banners that we show at the top of the page so components like EditPage
        // will be able to access this element's dimensions to make its own layout display correctly
        id={elementIDs.activeBanner}
        data-testid="accountOverrideBanner"
      >
        You are working as{' '}
        {accountName ||
          // Fall back to displaying the account's email if their name isn't available
          accountEmail}
        {/* If the account has a company name, display it */}
        {accountCompanyName ? ` at ${accountCompanyName}` : ''}. Close this tab to go back to your
        account.
      </div>
    </>
  );
};

/**
 * Renders the account override banner contents if the user is using a session override account
 */
const AccountOverrideBanner = () => {
  // If the session storage has an admin override account guid which matches our current account guid, that means
  // we're using an override account right now and should show the banner
  const isUsingAccountOverride = useSelector(selectors.isUsingAccountOverride);

  return isUsingAccountOverride ? <AccountOverrideBannerContents /> : null;
};

export default AccountOverrideBanner;
