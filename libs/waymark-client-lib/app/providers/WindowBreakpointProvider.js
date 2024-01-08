// Vendor
import {
    createContext,
    memo,
    useCallback,
    useState
} from 'react';

// Local
import {
    shouldShowBreakpointOnly
} from 'shared/utils/mediaBreakpoints.js';
import useWindowEvent from 'app/hooks/windowEvent.js';

// Mapping all breakpoints to numbers so that they can be easily compared
// ie, xl > lg, xs < md
export const breakpoints = {
    xs: 0,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
};

const breakpointNames = Object.keys(breakpoints);

// Find the first breakpoint that matches the current window width
const getCurrentBreakpointName = () =>
    breakpointNames.find((breakpointName) => shouldShowBreakpointOnly(breakpointName));

export const WindowBreakpointContext = createContext();

/**
 * Provider exposes information about the window's current breakpoint to make it nice and easy to
 * check for things like if the window is currently mobile or not
 */
const WindowBreakpointProvider = memo((props) => {
    const [windowBreakpoint, setWindowBreakpoint] = useState(getCurrentBreakpointName);

    // Keep the current window breakpoint up to date when the window is resized
    const onWindowResize = useCallback(() => setWindowBreakpoint(getCurrentBreakpointName()), []);
    useWindowEvent('resize', onWindowResize);

    return <WindowBreakpointContext.Provider value = {
        windowBreakpoint
    } { ...props
    }
    />;
});

export default WindowBreakpointProvider;