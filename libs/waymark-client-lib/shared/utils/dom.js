import {
    dataIsScrollLocked,
    dataIsSticky
} from 'styles/constants/dataset.js';

/**
 * Helper method to attach an event listener for the fullscreen api across different browsers
 * With help from: https://davidwalsh.name/fullscreen
 * @method requestFullscreen
 * @param  {Function} eventListener - Event Listener for the fullscreenchange event
 *
 * @return {Function} Cleanup method to remove the event listener
 */
export function addFullscreenEventListener(eventListener) {
    document.addEventListener('fullscreenchange', eventListener);

    return () => document.removeEventListener('fullscreenchange', eventListener);
}

/**
 * Helper Method to request the fullscreen api across different browsers
 * With help from: https://davidwalsh.name/fullscreen
 * @method requestFullscreen
 * @param  {DOM Element}          element DOM Element to call the fullscreen request on
 * @return {Promise|null}                 Callback for when the fullscreen request has been accepted/declined
 *                                        returns null if unable to request fullscreen mode on this DOM element
 */
export function requestFullscreen(element) {
    if (document.fullscreenEnabled) {
        return element.requestFullscreen();
    }

    return null;
}

/**
 * Helper Method to determine the state of the fullscreen mode across different browsers
 * With help from: https://davidwalsh.name/fullscreen
 * @method requestFullscreen
 */
export const isFullscreenEnabled = () => document.fullscreenElement != null;

/**
 * Helper Method to exit the fullscreen api across different browsers
 * With help from: https://davidwalsh.name/fullscreen
 * @method requestFullscreen
 */
export function exitFullscreen() {
    if (!isFullscreenEnabled()) return null;

    return document.exitFullscreen();
}

export const addEventListenersToElement = (element, eventListeners) => {
    eventListeners.forEach((listener) => {
        // If only a single event name was provided, add an event listener for that with the desired function and options
        if (listener.eventName)
            element.addEventListener(listener.eventName, listener.listenerFunction, listener.options);
        // If an array of event names was provided, add a listener for each one with the same function/options
        else if (listener.eventNames)
            listener.eventNames.forEach((eventName) => {
                element.addEventListener(eventName, listener.listenerFunction, listener.options);
            });
    });

    // Return an array that will remove all of the event listeners that we just added when you call it
    // That way you can just store the return value of this function and then call it in componentWillUnmount!
    return () => {
        eventListeners.forEach((listener) => {
            if (listener.eventName)
                element.removeEventListener(
                    listener.eventName,
                    listener.listenerFunction,
                    listener.options,
                );
            else if (listener.eventNames)
                listener.eventNames.forEach((eventName) => {
                    element.removeEventListener(eventName, listener.listenerFunction, listener.options);
                });
        });
    };
};

/**
 * Determines if we're being requested by the facebook app.
 *
 * Borrowed from: https://stackoverflow.com/questions/31569518/how-to-detect-facebook-in-app-browser
 *
 * Specifically we're checking for the facebook App Name(FBAN) and App Version(FBAV)
 */
export function isFacebookApp() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return userAgent.indexOf('FBAN') > -1 || userAgent.indexOf('FBAV') > -1;
}

/**
 * Scroll to the document body to the specified position immediately (defaults to top).
 * Designed to handle IE as well as modern browsers.
 */
export function scrollToPosition(position = 0) {
    let scrollTarget = position;

    /**
     * When our site is loaded from one of our video ads within the facebook mobile browser, the video
     * ad continues playing above the loaded waymark.com site. Because of this, every place in our site that used
     * `scrollToPosition(0)` (namely, every link navigating to a new page) would cause the window to scroll back to
     * the top of the video ad, above the loaded waymark.com site. This is because facebook listens for a scroll
     * event that reaches the top of the loaded site, and then pulls the video back into view whenever that happens.
     * To avoid this behavior for users that navigate around our site, when visited by a facebook mobile browser, we
     * tweak our "scrollToTop" behavior to only go as high as 1 -- never getting pushing the user all the way to the
     * top, thereby triggering the unfortunate facebook listener.
     */
    if (position === 0) {
        scrollTarget = isFacebookApp() ? 1 : position;
    }

    document.body.scrollTop = scrollTarget;
    // To ensure this works on IE...
    if (document.documentElement) {
        document.documentElement.scrollTop = scrollTarget;
    }
}

/**
 * Locks the page's scroll position and returns a method which will reverse this
 * to unlock scrolling again
 */
export const lockScrollPosition = () => {
    const currentScrollPosition = window.pageYOffset;

    // When we lock scrolling, this will mess up any sticky elements
    // that are actively "stuck" to the top of the page, so we should
    // get them, set position: fixed on them, and ensure we factor in their
    // height into the scroll position offset
    const activeStickyElements = document.querySelectorAll(`[${dataIsSticky}='true']`);
    let stickyElementScrollHeightOffset = 0;

    for (let i = 0; i < activeStickyElements.length; i += 1) {
        const stickyElement = activeStickyElements[i];
        stickyElementScrollHeightOffset += stickyElement.offsetHeight;
    }

    document.body.style.top = `${stickyElementScrollHeightOffset - currentScrollPosition}px`;
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.position = 'fixed';

    // Set a dataset attribute on the root element indicating that scrolling is locked on the page
    document.documentElement.setAttribute(dataIsScrollLocked, true);

    // Return a cleanup function that will unlock scrolling
    const unlockScrollPosition = () => {
        document.body.style.overflow = '';
        document.body.style.width = '';
        document.body.style.position = '';
        document.body.style.top = '';

        document.documentElement.removeAttribute(dataIsScrollLocked);

        window.scrollTo(0, currentScrollPosition);
    };

    return unlockScrollPosition;
};

/**
 * Checks if some portion of the supplied element is located in the viewport
 * @param  {DOM Element}  element Element to check position
 * @return {Boolean}              If the element is on screen
 */
export function isOnScreen(element) {
    const boundingRect = element.getBoundingClientRect();
    // Some browsers supply innerWidth and innerHeight, otherwise use clientWidth and clientHeight
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    return (
        // If the bottommost part of the element is below the top of the screen
        boundingRect.top + boundingRect.height >= 0 &&
        // If the topmost part of the element is above the bottom of the screen
        boundingRect.bottom - boundingRect.height <= windowHeight &&
        // If the rightmost part of the element is left of the left side of the screen
        boundingRect.left + boundingRect.width >= 0 &&
        // If the leftmost part of the element is right of the right side of the screen
        boundingRect.right - boundingRect.width <= windowWidth
    );
}

/**
 * Calculate a tween value between two points with an ease-in-out function applied
 * @param {number} start              The initial value that we're tweening from
 * @param {number} target             The target value that we're tweening to
 * @param {number} percentComplete    A percentage between 0-1 that represents how far along in the
 *                                    tween we are
 */
export const getTweenEaseInOut = (start, target, percentComplete) => {
    // Get the difference between the two positions
    const diff = target - start;

    // Use two different quadratic formulas for each half of the tween
    // The first eases in while the second eases out, but both meet in the middle where percentComplete is 0.5
    // In the first half of tween, use diff*2x^2 to ease in
    if (percentComplete < 0.5) return start + diff * 2 * percentComplete * percentComplete;
    // In the second half of tween, use diff*((4-2x)*x-1) to ease out
    return start + diff * ((4 - 2 * percentComplete) * percentComplete - 1);
};

/**
 * Smoothly scrolls to a given scroll y pos with an ease-in-out tween function
 * @param {number} targetScrollY                         The target for the new scroll pos
 * @param {number} [duration=300]                        How long the transition should last in ms
 * @param {number} [startScrollY=window.pageYOffset]     The initial page scroll pos that we're transitioning from - this will auto-populate to the
 *                                                        page's current scroll pos and then will be subsequently held onto each time the function recursively
 *                                                        requests another frame update
 * @param {number} [startTime=performance.now()]         The start time of the transition in ms - this will auto-populate to the current time
 *                                                        when the function is first called and then will be held onto each time the function recursively
 *                                                        requests another frame update
 * @param {number} [currentTime=performance.now()]       The current time in the transition in ms - this will auto-populate to the current time
 *                                                        when the function is first called and be updated to the current time each frame by
 *                                                        window.requestAnimationFrame()
 */
export const smoothScrollToPos = (
    targetScrollY,
    duration = 300,
    startScrollY = window.pageYOffset,
    startTime = performance.now(),
    currentTime = performance.now(),
) => {
    // Divide the amount of time that's elapsed since the transition start by the desired duration to get a nice number
    // between 0-1 to represent what point we are at in the transition
    const timeElapsed = currentTime - startTime;
    const percentComplete = timeElapsed / duration;

    // If more time has elapsed than the desired duration, snap to the end and return to break the loop
    if (percentComplete >= 1 || window.pageYOffset === targetScrollY) {
        window.scrollTo(0, targetScrollY);
        return;
    }

    const newScrollY = getTweenEaseInOut(startScrollY, targetScrollY, percentComplete);
    window.scrollTo(0, newScrollY);

    // window.requestAnimationFrame passes a DOMHighResTimeStamp to its callback, so we can use that
    // for the current time of the next frame
    window.requestAnimationFrame((nextFrameTime) =>
        smoothScrollToPos(targetScrollY, duration, startScrollY, startTime, nextFrameTime),
    );
};

/**
 * Smoothly scrolls to the top of a given target element
 * @param {element} targetElement       The element that we're scrolling to
 * @param {number}  [verticalOffset=0]  How much we should offset our scroll from the top of the arget element
 * @param {number}  [duration=300]      How long the transition should take in ms
 */
export const smoothScrollToElement = (targetElement, verticalOffset = 0, duration = 300) => {
    const elementScrollTop = targetElement.getBoundingClientRect().top + window.pageYOffset;

    return smoothScrollToPos(elementScrollTop + verticalOffset, duration);
};

/**
 * Smoothly scrolls to center a given target element vertically on the screen
 * @param {element} targetElement       The element that we're scrolling to
 * @param {number}  [verticalOffset=0]  How much we should offset our scroll from being perfectly centered
 * @param {number}  [duration=300]      How long the transition should take in ms
 */
export const smoothScrollToCenterElement = (targetElement, verticalOffset = 0, duration = 300) => {
    const elementBoundingRect = targetElement.getBoundingClientRect();

    // Calculate the center y pos of the element by adding half its height to its top
    const elementCenter =
        elementBoundingRect.top + window.pageYOffset + elementBoundingRect.height / 2;

    // Subtract half of the window's height from the element's center in order to center it, then apply
    // vertical offset if applicable
    const scrollTargetPos = elementCenter - window.innerHeight / 2 + verticalOffset;

    return smoothScrollToPos(scrollTargetPos, duration);
};

/**
 * Determines if otherNode is contained by refNode.
 *
 * @param      {Node}   refNode    The reference node
 * @param      {Node}   otherNode  The other node
 * @return     {boolean}  True if parent, False otherwise.
 */
export function isParent(refNode, otherNode) {
    let parent = otherNode.parentNode;
    do {
        if (refNode === parent) {
            return true;
        }
        parent = parent.parentNode;
    } while (parent);
    return false;
}

// Returns if otherNode is equivalent to refNode or is contained by refNode
export const isOrIsParentOf = (refNode, otherNode) =>
    refNode === otherNode || isParent(refNode, otherNode);

/**
 * @typedef {Object}  Position
 *
 * @property {number} x - The X coordinate in the client, as number of px from the left edge of the viewport
 * @property {number} y - The Y coordinate in the client, as number of px from the top edge of the viewpor†
 */

/**
 * Gets the x/y position of the user's mouse/touch in the viewport using the event object from a mouse or touch event
 *
 * @param {MouseEvent|TouchEvent} event   Mouse or touch event object from an event listener
 * @returns {Position}  Object with x and y position of the pointer in the client
 */
export const getPointerPositionFromEvent = (event) => {
    // Get the current mouse/touch position from this event
    let {
        clientX,
        clientY
    } = event;

    if (clientX == null || clientY == null) {
        // If the event didn't have a `clientX` value, it's probably a touch event so let's try to get the touch position
        if (event.touches && event.touches.length > 0) {
            [{
                clientX,
                clientY
            }] = event.touches;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            [{
                clientX,
                clientY
            }] = event.changedTouches;
        } else {
            clientX = 0;
            clientY = 0;
        }
    }

    // Return an object with the mouse/touch x and y position
    return {
        x: clientX,
        y: clientY,
    };
};