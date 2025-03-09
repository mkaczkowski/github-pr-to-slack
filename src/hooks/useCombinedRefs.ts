import { useCallback, MutableRefObject, Ref } from 'react';

/**
 * A hook that combines multiple refs into one
 * Useful when you need to pass a ref to a component that already has a ref
 */
export const useCombinedRefs = <T>(
  ...refs: Array<Ref<T> | MutableRefObject<T> | null | undefined>
): ((instance: T | null) => void) => {
  return useCallback(
    (instance: T | null) => {
      refs.forEach((ref) => {
        if (!ref) return;

        if (typeof ref === 'function') {
          ref(instance);
        } else {
          (ref as MutableRefObject<T | null>).current = instance;
        }
      });
    },
    [refs],
  );
};
