import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as selectors from 'app/state/selectors/index.js';
import { operations as accountOperations } from 'app/state/ducks/accounts/index.js';

export interface UserInfoForRender {
  isLoggedIn: boolean;
  hasSubscription: boolean;
  creditsRemaining: number;
  hasUnlimitedDownloads: boolean;
  canUserPurchase: boolean;
}

export const useUserInfoForRender = (): UserInfoForRender => {
  // User account info ---------------------------------------------------------
  const {
    isLoggedIn,
    accountSubscriptions,
    hasUnlimitedDownloads,
    canUserPurchase,
    accountVideoCredits,
    accountGUID,
  } = useSelector((state) => ({
    isLoggedIn: selectors.isLoggedIn(state),
    accountSubscriptions: selectors.getAllAccountSubscriptions(state),
    accountVideoCredits: selectors.getAccountVideoCreditCount(state),
    hasUnlimitedDownloads: selectors.hasUnlimitedDownloads(state),
    canUserPurchase: selectors.canUserPurchase(state),
    accountGUID: selectors.getAccountGUID(state),
  }));

  // Fetching the user's subscriptions on init, or when the accountGUID changes
  const [shouldRefetchSubscriptions, setShouldRefetchSubscriptions] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    if (shouldRefetchSubscriptions) {
      dispatch(accountOperations.loadAccountSubscriptions(accountGUID));
      setShouldRefetchSubscriptions(false);
    }
  }, [accountGUID, dispatch, shouldRefetchSubscriptions]);

  // Checking if the user has any subscriptions and or credits remaining
  const hasSubscription = useRef(false);
  const validAccountSubscriptions = useRef([]);

  useEffect(() => {
    if (accountSubscriptions) {
      // removing all undefined values from the array
      validAccountSubscriptions.current = accountSubscriptions.filter(
        (sub: any) => sub != undefined,
      );

      if (validAccountSubscriptions.current.length > 0) {
        hasSubscription.current = true;
      } else {
        hasSubscription.current = false;
      }
    }
  }, [accountSubscriptions]);

  return {
    isLoggedIn: isLoggedIn,
    hasSubscription: hasSubscription.current,
    creditsRemaining: accountVideoCredits,
    hasUnlimitedDownloads: hasUnlimitedDownloads,
    canUserPurchase: canUserPurchase,
  };
};
