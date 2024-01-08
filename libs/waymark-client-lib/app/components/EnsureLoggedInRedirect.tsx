import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Local
import * as loginActionNames from 'app/constants/LoginActionNames.js';
import { actions as loginActionActions } from 'app/state/ducks/loginActions/index.js';
import * as selectors from 'app/state/selectors/index.js';
import { appURLs } from 'app/constants/urls.js';
import { goToInternalURL } from 'app/utils/urls.js';

interface EnsureLoggedInRedirectProps {
  /**
   * Content to render if the user is logged in
   */
  children: React.ReactNode;
}

/**
 * Container to wrap page components and only render them if the user is logged in
 */
export const EnsureLoggedInRedirect: React.FC<EnsureLoggedInRedirectProps> = ({ children }) => {
  const isLoggedIn = useSelector(selectors.isLoggedIn);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isLoggedIn) {
      // Add a loginAction to redirect to the intended page after login.
      dispatch(
        loginActionActions.addLoginAction({
          name: loginActionNames.navigateToPage,
          args: [],
          nextURL: window.location.pathname,
        }),
      );
      goToInternalURL(appURLs.login);
    }
  }, [dispatch, isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
};

export default EnsureLoggedInRedirect;
