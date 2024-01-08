// Vendor
import { Route, Switch } from 'react-router-dom';

// Local
import {
  CheckoutPage,
  OfferCheckoutPage,
  OfferCheckoutSuccessPage,
  PageNotFoundPage,
} from 'app/components/LoadablePages.js';
import { appRoutePaths } from 'app/constants/urls.js';

const ShopRouter = () => (
  <Switch>
    <Route path={appRoutePaths.checkout} component={CheckoutPage} />
    <Route
      path={[appRoutePaths.offerCheckoutSuccess, appRoutePaths.subscriptionCheckoutSuccess]}
      component={OfferCheckoutSuccessPage}
    />
    <Route path={appRoutePaths.offerCheckout} component={OfferCheckoutPage} />

    <Route component={PageNotFoundPage} />
  </Switch>
);

export default ShopRouter;
