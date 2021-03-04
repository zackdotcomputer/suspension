import { useCallback, useEffect, useState } from "react";
import { CallState, CallStatus } from "./@types/CallState";
import FunctionWithArgs from "./@types/FunctionWithArgs";
import { LazySuspendableResult } from "./@types/LazySuspendableResult";
import { SuspendableWithArgs } from "./@types/Suspendable";
import SuspensionResolutionFailedError from "./FailedError/SuspensionResolutionFailedError";
import { DefaultSuspensionOptions, SuspensionOptions } from "./options/SuspensionOptions";

/**
 * Allows you to transform a promise-returning function into one which will trigger
 * Suspense and ErrorBoundary components in your React tree.
 *
 * Note, if you would only ever be calling this with the same args, it is best practice
 * to capture those args in a closure by making target `() => (realTarget(args))` and
 * then calling the trigger with (). This will optimize "needs refresh" check.
 *
 * @param target The promise-returning function you would like to link to Suspense
 * @param options Custom `SuspensionOptions` for this linkage.
 * @returns A two element array. Element one is the result you wanted or undefined
 *   if you haven't yet started the resolution. Element two is the function that will
 *   start the resolution. You pass any args to Element two and it will automatically
 *   cache results and refresh only if the args change. (You can override this default
 *   behavior using `options.shouldRefreshData`.)
 * @throws Per the Concurrent model, this function will throw a Promise if the resolution
 *   is actively in progress, which will be caught by Suspense. If the most recent
 *   resolution has failed, this function will always throw a SuspensionResolutionFailedError,
 *   which contains the underlying error and a retry function.
 */
export default function useLazySuspension<Result, Args extends any[] = []>(
  target: SuspendableWithArgs<Result, Args>,
  options?: SuspensionOptions
): LazySuspendableResult<Result, Args> {
  if (
    typeof window === "undefined" &&
    (options?.alwaysLoadingInSSR ?? DefaultSuspensionOptions.alwaysLoadingInSSR)
  ) {
    throw new Promise(() => {}); // Will never resolve, generating an "always loading" for SSR
  }

  const [callArgs, setCallArgs] = useState<Args | null>(null);
  const [callState, setCallState] = useState<CallState<Result>>({
    status: CallStatus.unstarted
  });

  const uncastStarter: (...a: Args) => Promise<Result> = useCallback(
    (...a: Args) => {
      const shouldRefreshData =
        options?.shouldRefreshData ?? DefaultSuspensionOptions.shouldRefreshData;

      // If we already have a result and the args are the same, don't kick off a new call.
      if (callState.status === CallStatus.success && !shouldRefreshData(callArgs, a)) {
        return Promise.resolve(callState.result);
      }

      // If we are currently loading and the args are the same, wait on the in-progress result.
      if (callState.status === CallStatus.loading && !shouldRefreshData(callArgs, a)) {
        return callState.promise;
      }

      // Otherwise, the call is either failed or unstarted or else the args are different enough
      // that we really do need to do a refresh.

      setCallArgs(a);

      const newResultsPromise = target(a);

      setCallState({ status: CallStatus.loading, promise: newResultsPromise });
      return newResultsPromise;
    },
    [target, callArgs, callState, options]
  );

  // NOTE I should research this cast to make sure it's 100% safe, but
  // testing it in modern Chrome and FF does confirm that there at least
  // it is, indeed, equivalent to say `(...a: []) => R` and `() => R`.
  // Which means that this cast SHOULD be ok? #famouslastwords
  const starterFunction = uncastStarter as FunctionWithArgs<Args, Promise<Result>>;

  useEffect(() => {
    // When a new load was started, hook the promise up to deliver results
    if (callState.status === CallStatus.loading) {
      const newPromise = callState.promise;

      newPromise
        .then((result) => {
          setCallState((oldState) => {
            // Make sure we haven't abandoned or already resolved this promise before
            // overwriting whatever is in the call state value.
            if (oldState.status === CallStatus.loading && oldState.promise === newPromise) {
              return {
                status: CallStatus.success,
                result
              };
            } else {
              return oldState;
            }
          });
          return result;
        })
        .catch((reason: Error) => {
          setCallState((oldState) => {
            // Make sure we haven't abandoned or already resolved this promise before
            // overwriting whatever is in the call state value.
            if (oldState.status === CallStatus.loading && oldState.promise === newPromise) {
              return {
                status: CallStatus.failed,
                error: reason
              };
            } else {
              return oldState;
            }
          });
        });
    }
  }, [callState]);

  // Handle the pending or failed cases, which throw for suspense
  if (callState.status === CallStatus.loading) {
    throw callState.promise;
  } else if (callState.status === CallStatus.failed) {
    // This error type includes a function that you can use in Error Boundary to retry
    throw new SuspensionResolutionFailedError(callState.error, starterFunction);
  }

  // Handle the success or unstarted cases, which return the value
  // (or lack thereof) and the trigger function.
  if (callState.status === CallStatus.success) {
    return [callState.result, starterFunction];
  }
  // Else unstarted
  return [undefined, starterFunction];
}
