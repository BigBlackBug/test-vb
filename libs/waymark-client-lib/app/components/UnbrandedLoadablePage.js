// Vendor
import {
    lazy,
    Suspense
} from 'react';

/**
 * Returns a simple blank unbranded loading page.
 */
const LoadingPage = () => < div / > ;

/**
 * Takes an import method for a page component on the site and returns a component which will use Suspense + React.lazy to load it with code splitting.
 * While the page bundle is loading, we will just show a blank un-branded div.
 *
 * @param  {func}  loader  Callable function that returns a loaded component.
 *                         Example loader:
 *                           const loader = () => import('app/containers/ExampleContainer.js')
 * @return {node}          Loadable component instance
 */
const UnbrandedLoadablePage = (loader) => {
    const LazyComponent = lazy(loader);

    return (props) => ( <
        Suspense fallback = { < LoadingPage / >
        } >
        <
        LazyComponent { ...props
        }
        /> <
        /Suspense>
    );
};

export default UnbrandedLoadablePage;