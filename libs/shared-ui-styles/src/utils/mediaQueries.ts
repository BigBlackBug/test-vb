const makeBreakpointQuery = (minWidth: number, maxWidth: number) => {
  // Parse the min and max widths into valid values that can be used in CSS
  const maxWidthCssValue = maxWidth === Infinity ? 'none' : `${maxWidth}px`;
  const minWidthCssValue = `${minWidth}px`;

  return {
    minWidth,
    maxWidth,
    // Query includes all screen sizes that are within the breakpoint's range or wider
    queryUp: `screen and (min-width: ${minWidthCssValue})`,
    // Query includes all screen sizes that are within the breakpoint's range or smaller
    queryDown: `screen and (max-width: ${maxWidthCssValue})`,
    // Query includes only screen sizes that are within the breakpoint's range
    queryOnly: `screen and (min-width: ${minWidthCssValue}) and (max-width: ${maxWidthCssValue})`,
  };
};

const smallBreakpoint = makeBreakpointQuery(576, 767);
const mediumBreakpoint = makeBreakpointQuery(768, 991);

export const mediaQueries = {
  breakpoints: {
    // Phones
    extraSmall: makeBreakpointQuery(0, 575),
    // Phones - Small Tablets | This is usually what you should use for "mobile" styling
    small: smallBreakpoint,
    // Tablets - Small Laptops
    medium: mediumBreakpoint,
    // Standard Computer Monitors
    large: makeBreakpointQuery(992, 1199),
    // Large/High-res Computer Monitors
    extraLarge: makeBreakpointQuery(1200, Infinity),
    // Aliases for common breakpoints
    mobile: smallBreakpoint.queryDown,
    desktop: mediumBreakpoint.queryUp,
  },
  prefersReducedMotion: '(prefers-reduced-motion)',
  pointer: {
    touchscreen: '(pointer: coarse)',
    mouse: '(pointer: fine)',
  },
};
