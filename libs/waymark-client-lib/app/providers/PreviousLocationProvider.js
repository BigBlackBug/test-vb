// Vendor
import {
    createContext,
    useContext,
    useEffect,
    useRef
} from 'react';
import {
    useLocation
} from 'react-router-dom';

// Local
import sharedPropTypes from 'shared/components/propTypes/index.js';

const PreviousLocationContext = createContext();

export const usePreviousLocation = () => useContext(PreviousLocationContext);

/**
 * Provider keeps track of whatever the last react-router location was
 */
export default function PreviousLocationProvider({
    children
}) {
    const currentLocation = useLocation();

    const previousLocationRef = useRef(null);

    useEffect(() => {
        previousLocationRef.current = currentLocation;
    }, [currentLocation]);

    return ( <
        PreviousLocationContext.Provider value = {
            previousLocationRef.current
        } > {
            children
        } <
        /PreviousLocationContext.Provider>
    );
}
PreviousLocationProvider.propTypes = {
    children: sharedPropTypes.children.isRequired,
};