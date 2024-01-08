// Vendor
import {
    lazy,
    Suspense
} from 'react';
import {
    css
} from '@emotion/css';

// Local
import WaymarkHeader from 'app/components/WaymarkHeader.js';
import ErrorBoundary from 'shared/components/ErrorBoundary';

/**
 * Takes an import method for a page component on the site and returns a component which will use Suspense + React.lazy to load it with code splitting.
 * While the page bundle is loading, we will show a branded Waymark header as a content placeholder.
 *
 * @param  {func}  loader  Callable function that returns a loaded component.
 *                         Example loader:
 *                           const loader = () => import('app/containers/ExampleContainer.js')
 * @return {node}          Loadable component instance
 */
const LoadablePage = (loader) => {
    const LazyComponent = lazy(loader);

    return (props) => (
        // If an error occurs while loading the page, we will show our error page
        <
        ErrorBoundary containerClass = {
            css `
        height: 100vh;
      `
        } >
        <
        Suspense fallback = {
            // While loading, show a branded header as a content placeholder.
            <
            WaymarkHeader / >
        } >
        <
        LazyComponent { ...props
        }
        /> <
        /Suspense> <
        /ErrorBoundary>
    );
};

export default LoadablePage;