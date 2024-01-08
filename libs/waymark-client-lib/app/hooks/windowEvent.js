import {
    useEffect
} from 'react';

/**
 * Utility hook handles cleanly adding/removing listeners to the window
 *
 * @param {string}  eventType       The event type that will be passed to `addEventListener`, ie "click" or "scroll"
 * @param {func}    eventCallback   The callback function to use for our event listener
 * @param {object}  [eventOptions]  Optional additional options to apply to the event listener, ie { passive: true }
 */
const useWindowEvent = (eventType, eventCallback, eventOptions) => {
    useEffect(() => {
        window.addEventListener(eventType, eventCallback, eventOptions);

        // Cleanup removes the event listener on component unmount or if any of our dependencies change such that we'll
        // need to reconstruct our event listener
        return () => window.removeEventListener(eventType, eventCallback, eventOptions);
    }, [eventType, eventCallback, eventOptions]);
};

export default useWindowEvent;