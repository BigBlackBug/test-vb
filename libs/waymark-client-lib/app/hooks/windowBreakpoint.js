// Vendor
import {
    useContext
} from 'react';

// Local
import {
    WindowBreakpointContext,
    breakpoints
} from 'app/providers/WindowBreakpointProvider.js';

/**
 * Utility hook returns whether the window's current size should be considered mobile or desktop
 */
export const useIsWindowMobile = () =>
    breakpoints[useContext(WindowBreakpointContext)] <= breakpoints.sm;

/**
 * Utility hook returns whether the window's current size is specifically XL
 */
export const useIsWindowXL = () =>
    breakpoints[useContext(WindowBreakpointContext)] >= breakpoints.xl;

/**
 * Utility hook returns current window breakpoint
 */
export const useWindowBreakpoint = () => useContext(WindowBreakpointContext);

/**
 * Hook returns whether the current window's breakpoint is equal to larger than a given breakpoint
 */
export const useIsWindowBreakpointUp = (breakpointName) =>
    breakpoints[useContext(WindowBreakpointContext)] >= breakpoints[breakpointName];

/**
 * Hook returns whether the current window's breakpoint is equal to or smaller than a given breakpoint
 */
export const useIsWindowBreakpointDown = (breakpointName) =>
    breakpoints[useContext(WindowBreakpointContext)] <= breakpoints[breakpointName];