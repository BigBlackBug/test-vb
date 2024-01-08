// Vendor
import _ from 'lodash';
import { useMemo } from 'react';

// Local
import useEvent from './useEvent';
import useStableObject from './useStableObject';

type CallbackFunction = ((...args: any[]) => unknown) | null | undefined;

/**
 * Takes a callback function and returns a debounced version using _.debounce.
 * Debouncing delays executing the callback until a given wait time has elapsed
 * without being called again.
 * This can be useful for applications like waiting until the user has stopped typing
 * before executing a search.
 *
 * @param {func} callback - Callback function to debounce
 * @param {number} debounceTime - Time in milliseconds that the callback should be debounced by
 */
export default function useDebounce<TCallback extends CallbackFunction>(
  callback: TCallback,
  debounceTime: number | null | undefined,
  debounceOptions: _.DebounceSettings | undefined = undefined,
) {
  // Make sure we have a stable reference for the callback
  const stableCallback = useEvent(callback);
  // Keeping the options object stable because we only want to re-create the
  // debounced function if the options actually change, not just if the object
  // is referentially different
  const stableDebounceOptions = useStableObject(debounceOptions);

  return useMemo(() => {
    // If we don't have a callback or debounce time (or the debounce time is 0), just return the callback value
    if (!stableCallback || !debounceTime) {
      return stableCallback;
    }

    return _.debounce(stableCallback, debounceTime, stableDebounceOptions);
  }, [stableCallback, debounceTime, stableDebounceOptions]);
}
