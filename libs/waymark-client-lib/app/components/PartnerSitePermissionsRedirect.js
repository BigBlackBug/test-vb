// Vendor
import {
    useEffect
} from 'react';
import {
    useDispatch,
    useSelector
} from 'react-redux';
import {
    useLocation,
    useRouteMatch
} from 'react-router-dom';

// Local
import {
    appRoutePaths,
    appURLs
} from 'app/constants/urls.js';
import {
    goToInternalURL
} from 'app/utils/urls.js';
import * as selectors from 'app/state/selectors/index.js';
import loginActionActions from 'app/state/ducks/loginActions/actions.js';
import * as loginActionNames from 'app/constants/LoginActionNames.js';

/**
 * Component watches for what subdomain the user belongs to and redirects them if they are
 * in the wrong place
 */
export default function PartnerSitePermissionsRedirect() {
    const location = useLocation();
    const dispatch = useDispatch();

    const isLoggedIn = useSelector(selectors.isLoggedIn);
    const isPrivatePartnerSite = useSelector(selectors.getBrandingProfileIsPrivateParterSite);

    const isOnLoginPage = useRouteMatch(appRoutePaths.login);

    useEffect(() => {
        // If the user is on a private partner site and isn't logged in, redirect them to the login page
        // (unless they're already there)
        if (isPrivatePartnerSite && !isLoggedIn && !isOnLoginPage) {
            dispatch(
                loginActionActions.addLoginAction({
                    name: loginActionNames.navigateToPage,
                    args: [],
                    nextURL: location.pathname,
                }),
            );
            goToInternalURL(appURLs.login);
        }
    }, [dispatch, isLoggedIn, isOnLoginPage, isPrivatePartnerSite, location.pathname]);

    return null;
}