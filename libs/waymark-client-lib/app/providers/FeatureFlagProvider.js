// Vendor
import {
    useSelector
} from 'react-redux';
import {
    OptimizelyProvider
} from '@optimizely/react-sdk';

// Local
import FeatureFlagService from 'app/services/FeatureFlagService.js';
import sharedPropTypes from 'shared/components/propTypes/index.js';
import * as selectors from 'app/state/selectors/index.js';

/**
 * Provides feature flag checking.
 *
 * Currently uses Optimizely Rollouts.
 *
 * This Provider doesn't create a context because that is handled by the wrapped OptimizelyProvider.
 */
const FeatureFlagProvider = ({
    children
}) => {
    const userData = useSelector(selectors.getFeatureFlagUserData);

    return ( <
        OptimizelyProvider optimizely = {
            FeatureFlagService.client
        }
        user = {
            userData
        } > {
            children
        } <
        /OptimizelyProvider>
    );
};

FeatureFlagProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};

export default FeatureFlagProvider;