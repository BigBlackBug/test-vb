/**
 * Defines dataset variable names that can be globally used in CSS
 * throughout the app
 */

// "data-is-scroll-locked" attribute is set on the root element to indicate
// that page scrolling is locked because a modal is open
export const dataIsScrollLocked = 'data-is-scroll-locked';

// "data-is-sticky" attribute is set on StickyElements to indicate whether or not
// they are currently stuck on the top of the page
export const dataIsSticky = 'data-is-sticky';

// "data-capture-default-modal-focus" attribute is set on focusable elements to indicate
// that they should be prioritized to receive initial focus when the modal they are inside is opened.
// This can be used if WaymarkModal's default behavior of focusing the very first focusable element
// in the modal is producing undesired behavior.
export const dataCaptureDefaultModalFocus = 'data-capture-default-modal-focus';