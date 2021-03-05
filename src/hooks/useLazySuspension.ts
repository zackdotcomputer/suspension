import isPromise from "is-promise";
import { useCallback, useState } from "react";
import {
  CallStatus,
  FunctionWithArgs,
  LazySuspendableResult,
  SuspendableWithArgs
} from "../@types";
import { SuspensionResolutionFailedError } from "../Errors";
import { DefaultSuspensionOptions, SuspensionOptions } from "../options/SuspensionOptions";
import { useNearestSuspensionRig } from "../SuspensionRig";

/**
 * Allows you to transform a promise-returning function into one which will trigger
 * Suspense and ErrorBoundary components in your React tree.
 *
 * Note, if you would only ever be calling this with the same args, it is best practice
 * to capture those args in a closure by making generator `() => (realTarget(args))` and
 * then calling the trigger with (). This will optimize "needs refresh" check.
 *
 * @param generator The promise-returning function you would like to link to Suspense
 * @param cacheKey A cache key for this suspension. It should be unique to *usage*,
 *   i.e. two different generators should definitely have different keys, but also
 *   the same generator whose access serves a different purpose should *also* have
 *   a different key. E.G. if we had four suspensions:
 *     1. My User Data for navbar
 *     2. My User Data for page contents
 *     3. Friend's User Data for page contents
 *     4. Movie data for page contents
 *   In this case, suspensions 1 and 2 should share a cache key because they are both
 *   the same accessor and also serve to fetch the same data. Suspensions 3 and 4
 *   should have *different* keys from 1, 2, and each other because they are not
 *   fetching the same data.
 * @param options Custom `SuspensionOptions` for this linkage.
 * @returns A two element array. Element one is the result you wanted or undefined
 *   if you haven't yet started the resolution. Element two is the function that will
 *   start the resolution. You pass any args to Element two and it will automatically
 *   cache results and refresh only if the args change. (You can override this default
 *   behavior using `options.shouldRefreshData`.)
 * @throws There are three main ways this hook can throw:
 *   1. Per the Concurrent model, this function will throw a Promise if the resolution is
 *   actively in progress. This is intended and will be caught by a Suspense.
 *   2. If resolution has failed, this function throws a `SuspensionResolutionFailedError`,
 *   which contains the underlying error and a retry function.
 *   3. If you use this hook while not inside of a `SuspensionRig` context, this function
 *   will throw a `SuspensionWithoutContextError` to notify you of that mistake.
 */
export default function useLazySuspension<Result, Args extends any[] = []>(
  generator: SuspendableWithArgs<Result, Args>,
  cacheKey: string,
  options?: SuspensionOptions
): LazySuspendableResult<Result, Args> {
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

  const currentValue = rig?.value<Result, Args>(cacheKey);

  const callState = currentValue?.callState;
  const callArgs = currentValue?.lastCallArgs ?? null;

  const [, setHasTriggeredStarter] = useState<boolean>(false);

  const uncastStarter: (...a: Args) => Promise<Result> = useCallback(
    (...a: Args) => {
      if (!rig) {
        throw new Error("Suspension Error - Starter was called too soon :(");
      }

      if (callState === undefined) {
        rig.initializeCall({
          key: cacheKey,
          generator
        });
      }

      const shouldRefreshData =
        options?.shouldRefreshData ?? DefaultSuspensionOptions.shouldRefreshData;

      // If we already have a result and the args are the same, don't kick off a new call.
      if (callState?.status === CallStatus.success && !shouldRefreshData(callArgs, a)) {
        return Promise.resolve(callState.result);
      }

      // If we are currently loading and the args are the same, wait on the in-progress result.
      if (callState?.status === CallStatus.loading && !shouldRefreshData(callArgs, a)) {
        return callState.promise;
      }

      // Otherwise, the call is either failed or unstarted or else the args are different enough
      // that we really do need to do a refresh.

      const newResultsPromise = generator(...a);

      rig.startCall({
        key: cacheKey,
        args: a,
        promise: newResultsPromise
      });

      // Set up the new promise to dispatch results to the cache
      newResultsPromise
        .then((result) => {
          rig.resolveCall({
            key: cacheKey,
            promise: newResultsPromise,
            resolution: {
              status: CallStatus.success,
              result
            }
          });
          return result;
        })
        .catch((reason: Error) => {
          rig.resolveCall({
            key: cacheKey,
            promise: newResultsPromise,
            resolution: {
              status: CallStatus.failed,
              error: reason
            }
          });
          throw reason;
        });

      // Manipulating a state value for the hook will cause the host component to be
      // redrawn, which will trigger a re-evaluation of the hook and a throw of the
      // Suspense promise.
      setHasTriggeredStarter(true);

      return newResultsPromise;
    },
    [generator, callArgs, callState, options]
  );

  // NOTE I should research this cast to make sure it's 100% safe, but
  // testing it in modern Chrome and FF does confirm that there at least
  // it is, indeed, equivalent to say `(...a: []) => R` and `() => R`.
  // Which means that this cast SHOULD be ok? #famouslastwords
  const starterFunction = uncastStarter as FunctionWithArgs<Args, Promise<Result>>;

  // Handle the pending or failed cases, which throw for suspense
  if (callState?.status === CallStatus.loading) {
    throw callState.promise;
  } else if (callState?.status === CallStatus.failed) {
    // This error type includes a function that you can use in Error Boundary to retry
    throw new SuspensionResolutionFailedError(callState.error, starterFunction);
  }

  // Handle the success or unstarted cases, which return the value
  // (or lack thereof) and the trigger function.
  if (callState?.status === CallStatus.success) {
    return [callState.result, starterFunction, callState];
  }
  // Else unstarted
  return [undefined, starterFunction, callState ?? { status: CallStatus.unstarted }];
}
