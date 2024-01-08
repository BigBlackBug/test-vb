import { Redirect, Route, Switch, RouteComponentProps } from 'react-router-dom';

// Local
import { PageNotFoundPage } from 'app/components/LoadablePages.js';
import { appRoutePaths, queryParams } from 'app/constants/urls.js';

const VideosRouter = ({ match: { path } }: RouteComponentProps) => (
  <Switch>
    {/* Redirect /videos/{slug} to /videos/{slug}/edit */}
    <Route
      path={`${path}/:variantSlug`}
      exact
      render={() => <Redirect to={appRoutePaths.editVariant} />}
    />
    <Route
      path={appRoutePaths.oldCollectionView}
      render={({ match: { params } }) => (
        <Redirect
          to={{
            pathname: appRoutePaths.templateBrowser,
            search: params.collectionSlug
              ? `?${queryParams.templateBrowserFilters.collection}=${params.collectionSlug}`
              : undefined,
          }}
        />
      )}
    />

    <Route component={PageNotFoundPage} />
  </Switch>
);

export default VideosRouter;
