import _ from 'lodash';
import { useEffect, useRef } from 'react';
import useEvent from './useEvent';

/**
 * Hook provides an interface for adding an event listener to an event target, making sure the listener callback's ref and
 * the options object are stabilized and the listener will be cleaned up correctly when the consuming component unmounts.
 *
 * @param {EventTarget | React.RefObject} eventTarget - The event target to add the event listener to (e.g. window, document, an HTML element, or a React ref to an HTML element).
 * @param {string} eventName - The name of the event to listen for.
 * @param {EventListener} callback - The listener callback which will be called when the event is fired.
 * @param {boolean | AddEventListenerOptions} [options] - Optional options to pass to the event listener. The ref for this object will be stabilized, so
 *                                                        you don't need to worry about memoizing it before passing it to this hook.
 */
export default function useAddEventListener<T extends EventTarget | React.RefObject<EventTarget>>(
  eventTarget: T | null,
  eventName: string,
  callback: EventListener,
  options?: boolean | AddEventListenerOptions,
) {
  const stableCallback = useEvent(callback);
  // Stabilize the options object with deep equality checks to avoid adding/removing the event listener unnecessarily
  // on every render.
  const stableOptionsRef = useRef(options);
  if (options !== stableOptionsRef.current && !_.isEqual(options, stableOptionsRef.current)) {
    stableOptionsRef.current = options;
  }
  const stableOptions = stableOptionsRef.current;

  useEffect(() => {
    const element = eventTarget instanceof EventTarget ? eventTarget : eventTarget?.current;
    if (!element) {
      return undefined;
    }

    element.addEventListener(eventName, stableCallback, stableOptions);

    return () => {
      // Remove the listener on cleanup
      element.removeEventListener(eventName, stableCallback, stableOptions);
    };
  }, [eventTarget, eventName, stableCallback, stableOptions]);
}
