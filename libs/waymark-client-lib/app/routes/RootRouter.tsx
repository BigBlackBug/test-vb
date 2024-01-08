// Vendor
import { Route, Switch } from 'react-router-dom';

// Local
import {
  AuthPage,
  PageNotFoundPage,
  ResetPasswordPage,
  TemplateBrowserPage,
  AI1XPage,
} from 'app/components/LoadablePages.js';
import { appRoutePaths } from 'app/constants/urls.js';

/**
 * The ReactRouter that powers our app.
 *
 * @memberOf app.components
 * @param {Object} props
 * @param {external:ReactRouter.match} props.match
 * @returns {external:ReactRouter.Switch}
 */
const RootRouter = () => (
  <Switch>
    <Route path={appRoutePaths.ai} component={AI1XPage} />
    <Route path={appRoutePaths.templateBrowser} component={TemplateBrowserPage} />
    <Route path={[appRoutePaths.login, appRoutePaths.signup]} component={AuthPage} />
    <Route path={appRoutePaths.resetPassword} component={ResetPasswordPage} />

    {/* Display the Page Not Found page for unmatched paths. This only matches previously unmatched
    paths on the base path, so broken URLs within other routers won't land on this 404 page via this route. */}
    <Route component={PageNotFoundPage} />
  </Switch>
);

export default RootRouter;
