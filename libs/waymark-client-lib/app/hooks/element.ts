// Vendor
import _ from 'lodash';
import { useState, useEffect } from 'react';

// Callback gets and returns an element from the DOM
type getTargetElementCallback = () => HTMLElement | null;
// A callback which returns an an element, or a React ref to an element
type WatchTarget = getTargetElementCallback | React.RefObject<HTMLElement | null> | null;

/**
 * Extracts the HTML element from a generic WatchTarget
 * @param {WatchTarget} watchTarget
 * @returns {HTMLElement}
 */
const extractElementFromWatchTarget = (watchTarget: WatchTarget) => {
  if (typeof watchTarget === 'function') {
    return watchTarget();
  }

  return watchTarget?.current ?? null;
};

/**
 * Hook extracts the HTML element from a generic WatchTarget.
 * This hook should be used to guarantee that React refs are able to
 * be extracted correctly.
 *
 * @param {WatchTarget} watchTarget
 * @returns {HTMLElement}
 */
const useWatchTargetElement = (watchTarget: WatchTarget) => {
  const [watchTargetElement, setWatchTargetElement] = useState<HTMLElement | null>(() =>
    extractElementFromWatchTarget(watchTarget),
  );

  // Extracting the element in an effect so we can guarantee that React ref objects
  // will be set and usable
  useEffect(() => {
    setWatchTargetElement(extractElementFromWatchTarget(watchTarget));
  }, [watchTarget]);

  return watchTargetElement;
};

type SizeChangeEvent = CustomEvent<{ clientRect: DOMRect }>;

/**
 * ResizeObserver watches for elements' sizes to change and fires a custom `size-change` event
 * so we can watch for these changes
 */
const elementSizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    // Fire a custom `size-change` event on the element with the target's new content rect
    const event: SizeChangeEvent = new CustomEvent('size-change', {
      detail: { clientRect: entry.target.getBoundingClientRect() },
    });
    entry.target.dispatchEvent(event);
  });
});

/**
 * Hook keeps track of and returns a given element's bounding client rect as it resizes
 * You can pass a ref ie:
 *  const myRef = useRef();
 *  useElementBoundingClientRect(myRef);
 *
 * Or a callback that returns an element, ie:
 *  useElementBoundingClientRect(()=>document.getElementByID('...'));
 *
 * @param {WatchTarget} watchTarget   A callback which returns the target element or a React ref to the target element
 *                                     that we want to observe the client rect of
 *
 * @returns {DOMRect} The current client rect for the target element
 */
export const useElementBoundingClientRect = (watchTarget: WatchTarget) => {
  const watchTargetElement = useWatchTargetElement(watchTarget);

  const [elementBoundingClientRect, setElementBoundingClientRect] = useState(
    () =>
      // Try to get an initial client rect from the watchTarget if possible
      watchTargetElement?.getBoundingClientRect() || null,
  );

  useEffect(() => {
    if (!watchTargetElement) {
      return undefined;
    }

    const onSizeChange = (event: Event) => {
      // Get the new content rect from the event, or fall back to getting it off the element ourselves if something went wrong
      let newClientRect: DOMRect = (event as SizeChangeEvent).detail?.clientRect;

      if (!newClientRect) {
        newClientRect = watchTargetElement.getBoundingClientRect();
      }

      setElementBoundingClientRect(newClientRect);
    };
    watchTargetElement.addEventListener('size-change', onSizeChange);

    // Start observing the element's size
    elementSizeObserver.observe(watchTargetElement);

    return () => {
      // Stop observing the element to clean up memory leaks
      elementSizeObserver.unobserve(watchTargetElement);
      watchTargetElement.removeEventListener('size-change', onSizeChange);
    };
  }, [watchTargetElement]);

  return elementBoundingClientRect;
};

type VisibilityChangeEvent = CustomEvent<{ isVisible: boolean }>;

const defaultDeriveIsVisibleFromEntry = (entry: IntersectionObserverEntry) => entry.isIntersecting;

// Generate an IntersectionObserver instance with desired options applied
export const makeIntersectionObserver = (
  options?: IntersectionObserverInit,
  deriveIsVisibleFromEntry: (
    entry: IntersectionObserverEntry,
  ) => boolean = defaultDeriveIsVisibleFromEntry,
) =>
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Fire a custom `visibility-change` event on the element to indicate whether the
      // it's currently visible in the viewport or not
      const event: VisibilityChangeEvent = new CustomEvent('visibility-change', {
        detail: { isVisible: deriveIsVisibleFromEntry(entry) },
      });
      entry.target.dispatchEvent(event);
    });
  }, options);

// Create a default intersection observer with no options applied which we will use
// unless otherwise specified
export const defaultIntersectionObserver = makeIntersectionObserver();

/**
 * Hook watches a target element using an intersection observer and returns
 * whether the element is currently visible in the viewport or not.
 *
 * You can pass a ref ie:
 *  const myRef = useRef();
 *  useIsElementInViewport(myRef);
 *
 * Or a callback that returns an element, ie:
 *  useIsElementInViewport(()=>document.getElementByID('...'));
 *
 * @param {WatchTarget} watchTarget   A callback which returns the target element or a React ref to the target element
 *                                     that we want to observe the client rect of
 * @param {IntersectionObserver}  [intersectionObserver]  The IntersectionObserver that we should use to observe this element.
 *                                                          This is optional and will use our defaultIntersectionObserver if not specified,
 *                                                          but can be useful if you need to use an IntersectionObserver with custom options,
 *                                                          ie, if you want to modify exactly when elements are considered to be intersecting the viewport
 *                                                          with the `threshold` and `rootMargin` options.
 *
 * @returns {boolean}   Whether the target element is currently intersecting with the viewport.
 */
export const useIsElementInViewport = (
  watchTarget: WatchTarget,
  intersectionObserver: IntersectionObserver = defaultIntersectionObserver,
) => {
  const watchTargetElement = useWatchTargetElement(watchTarget);

  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    if (!watchTargetElement || !intersectionObserver) {
      return undefined;
    }

    const onVisibilityChange = (event: Event) => {
      // Get the new isVisible status for the element, or fall back to true
      // to make sure we don't hide any contents if something goes wrong
      const isVisible = (event as VisibilityChangeEvent).detail?.isVisible ?? true;

      setIsInViewport(isVisible);
    };
    watchTargetElement.addEventListener('visibility-change', onVisibilityChange);

    // Start observing the element's intersection in the viewport
    intersectionObserver.observe(watchTargetElement);

    return () => {
      // Stop observing the element to clean up memory leaks
      intersectionObserver.unobserve(watchTargetElement);
      watchTargetElement.removeEventListener('visibility-change', onVisibilityChange);
    };
  }, [watchTargetElement, intersectionObserver]);

  return isInViewport;
};

/**
 * Keeps track of the given element's position relative to the top of the window (clientRect.top)
 * as the user scrolls and/or resizes the page
 *
 * @param {WatchTarget} watchTarget   A callback which returns the target element or a React ref to the target element
 *                                     that we want to observe the client rect of
 * @param {number} [eventListenerThrottleTimeout=100]   The amount of time to throttle our event handler for onScroll and
 *                                                      onResize events.
 *
 * @returns {number}  The top position of the element's client rect
 */
export const useCurrentElementScrollPosition = (
  watchTarget: WatchTarget,
  eventListenerThrottleTimeout = 100,
) => {
  const watchTargetElement = useWatchTargetElement(watchTarget);

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (!watchTargetElement) {
      return undefined;
    }

    const onScrollOrResize = _.throttle(() => {
      const clientRect = watchTargetElement.getBoundingClientRect();

      setScrollPosition(clientRect.top);
    }, eventListenerThrottleTimeout);
    onScrollOrResize();

    const passiveEventListenerConfig = { passive: true, capture: true };

    window.addEventListener('scroll', onScrollOrResize, passiveEventListenerConfig);
    window.addEventListener('resize', onScrollOrResize, passiveEventListenerConfig);

    return () => {
      onScrollOrResize.flush();
      window.removeEventListener('scroll', onScrollOrResize, passiveEventListenerConfig);
      window.removeEventListener('resize', onScrollOrResize, passiveEventListenerConfig);
    };
  }, [watchTargetElement, eventListenerThrottleTimeout]);

  return scrollPosition;
};
