// Vendor
import { Route, Switch } from 'react-router-dom';

// Local
import { appRoutePaths } from 'app/constants/urls.js';
import { WaymarkEditPage } from 'app/components/LoadablePages.js';
import AccountRouter from './AccountRouter';
import ShopRouter from './ShopRouter';
import VideosRouter from './VideosRouter';
import RootRouter from './RootRouter';

/**
 * Renders all routes for pages in the Waymark app.
 */
export default function AppRoutes() {
  return (
    <Switch>
      {/* Sharing a route between the variant and user video edit page routes so we can smoothly transition
        between them when saving a variant for the first time */}
      <Route
        path={[appRoutePaths.editVariant, appRoutePaths.editYourVideo]}
        component={WaymarkEditPage}
      />
      <Route path="/account" component={AccountRouter} />
      <Route path="/shop" component={ShopRouter} />
      <Route path="/videos" component={VideosRouter} />
      {/* Gotta move this */}
      <Route path="" component={RootRouter} />
    </Switch>
  );
}
