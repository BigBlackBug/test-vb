import _ from 'lodash';
import { useRef } from 'react';

/**
 * Takes an object and returns a stable version of it which will only change when the
 * original object's values deeply change. This allows us to avoid unwanted rerenders
 * caused by an object reference changing, even if the values are the same.
 */
export default function useStableObject<TObject extends object | null | undefined>(
  object: TObject,
) {
  const stableObjectRef = useRef<TObject>(object);
  if (stableObjectRef.current !== object) {
    if (!_.isEqual(stableObjectRef.current, object)) {
      stableObjectRef.current = object;
    }
  }

  return stableObjectRef.current;
}
