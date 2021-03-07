import isPromise from "is-promise";
import { useCallback } from "react";
import { SuspendableWithArgs, SuspensionOptions } from "..";
import { CallState, CallStatus } from "../@types";
import { DefaultSuspensionOptions } from "../options/SuspensionOptions";
import { useNearestSuspensionRig } from "../SuspensionRig";

/**
 * Internal use only hook
 * @returns a loader that can get a filtered cache state for this key given args
 *   provided at a later time.
 * @throws Only if the rig is missing or uninitialized.
 */
export default function useCacheStateLoader<Result, Args extends any[] = []>(
  generator: SuspendableWithArgs<Result, Args>,
  cacheKey: string,
  options?: SuspensionOptions
): (...args: Args) => CallState<Result> {
  if (
    typeof window === "undefined" &&
    (options?.alwaysLoadingInSSR ?? DefaultSuspensionOptions.alwaysLoadingInSSR)
  ) {
    throw new Promise(() => {}); // Will never resolve, generating an "always loading" for SSR
  }

  const rig = useNearestSuspensionRig();

  // If our parent rig exists but isn't mounted yet, wait until it finishes and try again.
  if (isPromise(rig)) {
    throw rig;
  }

  return useCallback(
    (...a: Args): CallState<Result> => {
      if (!rig) {
        // Sanity check. This should be impossible, but gotta be safe.
        throw new Error("Suspension Error - Cache loader was called without a rig");
      }

      const currentValue = rig?.value<Result, Args>(cacheKey);
      const callState = currentValue?.callState;
      const callArgs = currentValue?.lastCallArgs ?? null;

      if (callState === undefined) {
        rig.initializeCall({
          key: cacheKey,
          generator
        });
        return { status: CallStatus.unstarted };
      }

      const shouldRefreshDataF =
        options?.shouldRefreshData ?? DefaultSuspensionOptions.shouldRefreshData;

      // If the args don't match, then always treat it as "unstarted" because we basically haven't started.
      if (shouldRefreshDataF(callArgs, a)) {
        return { status: CallStatus.unstarted };
      }

      // Otherwise, we can return the state we have in the cache
      return callState;
    },
    [rig, cacheKey]
  );
}
