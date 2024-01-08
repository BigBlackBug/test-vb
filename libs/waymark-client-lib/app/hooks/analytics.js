// Vendor
import {
    useEffect
} from 'react';
import {
    useRouteMatch
} from 'react-router-dom';
import {
    useSelector
} from 'react-redux';

// Local
import {
    appPathAnalyticsCategories
} from 'app/constants/analytics.js';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import EditorAnalyticsMetricTrackingManager from 'app/services/EditorAnalyticsMetricTrackingManager.js';

// eslint-disable-next-line import/prefer-default-export
export const useTrackPageAnalytics = () => {
    const {
        path
    } = useRouteMatch();

    // Set the default page category to use for events that don't have a custom `eventCategory` param set
    const analyticsCategoryForMatchPath = useSelector((state) => {
        const category = appPathAnalyticsCategories[path] || path;
        // If the analytics category for this path is a function, call it with the current redux state
        // so it can construct a category string
        // (this is useful for instances like if we need to inject the user's partner slug into a category)
        if (typeof category === 'function') {
            return category(state);
        }

        return category;
    });

    useEffect(() => {
        GoogleAnalyticsService.setPageCategory(analyticsCategoryForMatchPath);
    }, [analyticsCategoryForMatchPath]);

    useEffect(() => {
        // Update the editor metric tracking manager as the current app route changes
        // This will give it context on when to start/stop tracking based on what page the user is on
        EditorAnalyticsMetricTrackingManager.onAppRoutePathChanged(path);
    }, [path]);
};