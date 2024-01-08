// Vendor
import _ from 'lodash';
import { useMemo } from 'react';

// Local
import useEvent from './useEvent';
import useStableObject from './useStableObject';

type CallbackFunction = ((...args: any[]) => unknown) | null | undefined;

/**
 * Takes a callback function and returns a throttled version using _.throttle.
 * Throttling limits how often a callback can be executed; if the callback is called
 * twice before the throttle time has elapsed, the second call will be delayed until
 * the time has elapsed, or canceled if the callback is called again.
 * This can be useful for applications where we have an expensive action which we
 * want to run _while_ the user is doing something, as opposed to debouncing where you
 * have to wait until the user has fully stopped.
 *
 * @param {func} callback - Callback function to throttle.
 * @param {number} throttleTime - Time in milliseconds that the callback should be throttled by
 */
export default function useThrottle<TCallback extends CallbackFunction>(
  callback: TCallback,
  throttleTime: number | null | undefined,
  throttleOptions: _.ThrottleSettings | undefined = undefined,
) {
  // Make sure we have a stable reference for the callback
  const stableCallback = useEvent(callback);
  // Keeping the options object stable because we only want to re-create the
  // throttled function if the options actually change, not just if the object
  // is referentially different
  const stableThrottleOptions = useStableObject(throttleOptions);

  return useMemo(() => {
    // If we don't have a callback or throttle time (or the throttle time is 0), just return the callback value
    if (!stableCallback || !throttleTime) {
      return stableCallback;
    }

    return _.throttle(stableCallback, throttleTime, stableThrottleOptions);
  }, [stableCallback, stableThrottleOptions, throttleTime]);
}
