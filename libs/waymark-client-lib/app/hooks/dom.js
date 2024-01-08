// Vendor
import _ from 'lodash';
import {
    useEffect,
    useState
} from 'react';

// Local
import {
    scrollToPosition
} from 'shared/utils/dom.js';
import {
    dataIsScrollLocked
} from 'styles/constants/dataset.js';

/**
 * Hooks scrolls the page up to the top on mount. Subsequent scrolls
 * can be triggered by changing the key provided to the hook.
 *
 * @param {string} key  Optional key which can be changed to re-trigger scrolling to the top of the page
 */
export const useScrollToTop = (key = null) => {
    useEffect(() => {
        scrollToPosition(0);
    }, [key]);
};

/**
 * Hook returns the window's current scroll position as it changes.
 */
export const useWindowScrollPosition = (throttleTimeout = 50) => {
    const [scrollPosition, setScrollPosition] = useState(window.pageYOffset);

    useEffect(() => {
        // Throttle the listener for a slightly better performance experience
        const onScroll = _.throttle(() => {
            // Don't update scroll position when scrolling is locked on the page
            const isScrollingLocked = document.documentElement.getAttribute(dataIsScrollLocked);

            if (!isScrollingLocked) {
                setScrollPosition(window.pageYOffset);
            }
        }, throttleTimeout);

        // Calling onScroll once immediately to establish our initial scroll position
        onScroll();

        const eventOptions = {
            passive: true,
            capture: true
        };
        window.addEventListener('scroll', onScroll, eventOptions);

        return () => {
            onScroll.flush();
            window.removeEventListener('scroll', onScroll, eventOptions);
        };
    }, [throttleTimeout]);

    return scrollPosition;
};