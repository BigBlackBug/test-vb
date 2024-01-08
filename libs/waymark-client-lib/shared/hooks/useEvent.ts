import { useRef } from 'react';

type CallbackFunction = ((...args: any[]) => unknown) | null | undefined;

/**
 * Implementation of the `useEvent` hook which was proposed for React (https://github.com/reactjs/rfcs/pull/220)
 * This hook helps with cases where you have a function which is executed from an effect when some event occurs
 * like a state value changing, but you don't want to re-trigger the effect if the callback function's
 * reference changes. For instance, say your component takes an `onChange` callback which is called from an effect when
 * a `value` state changes. We don't want to trigger the effect and call `onChange` every time its reference changes (which
 * could be every render), we just want to trigger the effect when `value` changes. This makes it easier for us to
 * create a stable reference to `onChange` so we know we can include it in the effect's dependency array without having to
 * add additional annoying logic to the effect.
 *
 * It is worth noting that the React team has decided to shelve adding this hook to React, and not without
 * good reason; it can be tempting to overuse and even misuse this hook, so they want to try a different path
 * for dealing with the problems that this hook was intended to solve.
 *
 * However, in the meantime, this hook can still useful for our purposes. Just be careful and make sure
 * you really need to use it!
 *
 * @param {func} callback - A referentially unstable callback function that gets re-created on every render
 *
 * @example
 * const { onChange } = props;
 *
 * const [value, setValue] = useState("");
 *
 * const previousValueRef = useRef(value);
 *
 * useEffect(()=>{
 *   // When just directly using the onChange callback, we have to add a guard to make sure we
 *   // only call onChange when the value has actually changed
 *   if(value !== previousValueRef.current){
 *     onChange(value);
 *   }
 * },[value, onChange]);
 *
 * const stableOnChange = useEvent(onChange);
 *
 * useEffect(()=>{
 *  // This effect will only run when value changes!
 *  stableOnChange(value);
 * }, [value, stableOnChange])
 */
export default function useEvent<TCallback extends CallbackFunction>(callback: TCallback) {
  const callbackRef = useRef<TCallback>(callback);
  callbackRef.current = callback;

  // This could be implemented with `useCallback` as well, this is just a micro-optimization
  // to avoid creating a new function and dependency array on every render
  const stableCallbackRef = useRef<TCallback>();
  if (!stableCallbackRef.current) {
    stableCallbackRef.current = ((...args) => callbackRef.current?.(...args)) as TCallback;
  }

  // If the callback is null or undefined, we don't want to return the stable callback,
  // just return the same null/undefined value right back
  if (!callback) {
    return callback;
  }

  return stableCallbackRef.current;
}
