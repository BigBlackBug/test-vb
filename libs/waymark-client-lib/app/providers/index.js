// Vendor
import PropTypes from 'prop-types';
import {
    DndProvider
} from 'react-dnd';
import {
    HTML5Backend
} from 'react-dnd-html5-backend';
import {
    ApolloProvider
} from '@apollo/client';

// Local
import PreviousLocationProvider from 'app/providers/PreviousLocationProvider.js';
import WindowBreakpointProvider from 'app/providers/WindowBreakpointProvider.js';
import NotificationMessageProvider from 'app/providers/NotificationMessageProvider.js';
import NotificationMessageDisplay from 'app/components/NotificationMessageDisplay.js';
import FeatureFlagProvider from 'app/providers/FeatureFlagProvider.js';
import LoginProtectedActionModalProvider from 'app/providers/LoginProtectedActionModalProvider';
import {
    apolloClient
} from 'shared/api/graphql';

/**
 * This is a single convenient component where we can stick all providers that we want
 * to be globally accessible throughout the app. This component will be used once to wrap the entire app
 * in app/index.js
 */
const GlobalProviders = ({
    children
}) => ( <
    FeatureFlagProvider >
    <
    DndProvider backend = {
        HTML5Backend
    } >
    <
    ApolloProvider client = {
        apolloClient
    } >
    <
    PreviousLocationProvider >
    <
    WindowBreakpointProvider >
    <
    LoginProtectedActionModalProvider >
    <
    NotificationMessageProvider > {
        children
    } <
    NotificationMessageDisplay / >
    <
    /NotificationMessageProvider> <
    /LoginProtectedActionModalProvider> <
    /WindowBreakpointProvider> <
    /PreviousLocationProvider> <
    /ApolloProvider> <
    /DndProvider> <
    /FeatureFlagProvider>
);

GlobalProviders.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};

export default GlobalProviders;