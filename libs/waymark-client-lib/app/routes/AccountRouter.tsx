import { Route, Switch } from 'react-router-dom';

// Local
import EnsureLoggedInRedirect from 'app/components/EnsureLoggedInRedirect';
import {
  AccountSettingsPage,
  AccountVideosPage,
  ManagedAccountsPage,
  PageNotFoundPage,
} from 'app/components/LoadablePages.js';
import { appRoutePaths } from 'app/constants/urls.js';

const AccountRouter = () => (
  <EnsureLoggedInRedirect>
    <Switch>
      <Route exact path={appRoutePaths.accountVideos} component={AccountVideosPage} />
      <Route path={appRoutePaths.accountSettings} component={AccountSettingsPage} />
      <Route path={appRoutePaths.manageClientAccounts} component={ManagedAccountsPage} />
      <Route component={PageNotFoundPage} />
    </Switch>
  </EnsureLoggedInRedirect>
);

export default AccountRouter;
