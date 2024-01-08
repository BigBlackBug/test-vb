import breakpoints from 'styles/constants/breakpoints.js';

// Map our breakpoint constants to the shorthand breakpoint names that we use here
export const mediaBreakpoints = {
    xs: breakpoints.extraSmall,
    sm: breakpoints.small,
    md: breakpoints.medium,
    lg: breakpoints.large,
    xl: breakpoints.extraLarge,
};

export const getScreenWidth = () =>
    /* We used to simply return `window.innerWidth` here, but we experienced bugs
    related to `window.innerWidth` reporting inaccurate numbers (specifically 1500 and 995)
    during page navigation and page loading even when the window was a mobile, 375px width.
    See console screenshot (https://cl.ly/09d960a5791f) for a very simple demonstration of one
    such occurrance. For right now, I don't believe the `window.innerWidth` fallback will ever
    be hit, but keeping it in here just in case.
     */
    document.documentElement.clientWidth || window.innerWidth;
export const getScreenHeight = () => window.innerHeight;

/**
 * Test to determine if the screen size is at or above a breakpoint
 * @method shouldShowBreakpointUp
 * @param  {String}               breakpointName The breakpoint name to check ('xs', 'sm', etc)
 * @return {Boolean}                             If the screen size passes the test
 */
export const shouldShowBreakpointUp = (breakpointName) => {
    const screenWidth = getScreenWidth();
    return screenWidth >= mediaBreakpoints[breakpointName].minWidth;
};

/**
 * Test to determine if the screen size is at or below a breakpoint
 * @method shouldShowBreakpointDown
 * @param  {String}               breakpointName The breakpoint name to check ('xs', 'sm', etc)
 * @return {Boolean}                             If the screen size passes the test
 */
export const shouldShowBreakpointDown = (breakpointName) => {
    const screenWidth = getScreenWidth();
    return screenWidth <= mediaBreakpoints[breakpointName].maxWidth;
};

/**
 * Test to determine if the screen size is within a breakpoint
 * @method shouldShowBreakpointOnly
 * @param  {String}               breakpointName The breakpoint name to check ('xs', 'sm', etc)
 * @return {Boolean}                             If the screen size passes the test
 */
export const shouldShowBreakpointOnly = (breakpointName) =>
    shouldShowBreakpointUp(breakpointName) && shouldShowBreakpointDown(breakpointName);

/**
 * Test to determine if the screen size is within two breakpoints
 * @method shouldShowBreakpointBetween
 * @param  {String}               breakpointNameLower The breakpoint name to check ('xs', 'sm', etc)
 * @param  {String}               breakpointNameUpper The breakpoint name to check ('xs', 'sm', etc)
 * @return {Boolean}                                  If the screen size passes the test
 */
export const shouldShowBreakpointBetween = (breakpointNameLower, breakpointNameUpper) =>
    shouldShowBreakpointUp(breakpointNameLower) && shouldShowBreakpointDown(breakpointNameUpper);

export const isXSScreen = () => shouldShowBreakpointOnly('xs');

export const isSMScreen = () => shouldShowBreakpointOnly('sm');

export const isMDScreen = () => shouldShowBreakpointOnly('md');

export const isLGScreen = () => shouldShowBreakpointOnly('lg');

export const isXLScreen = () => shouldShowBreakpointOnly('xl');