import isPromise from "is-promise";
import { useCallback } from "react";
import { CallStatus, FunctionWithArgs, SuspendableWithArgs } from "../@types";
import { LazySuspensionReaders } from "../@types";
import { SuspensionResolutionFailedError } from "../Errors";
import { SuspensionOptions } from "../options/SuspensionOptions";
import { useNearestSuspensionRig } from "../SuspensionRig";
import useGetCacheLoader from "./useGetCacheLoader";

/**
 * Allows you to transform a promise-returning function into one which will trigger
 * Suspense and ErrorBoundary components in your React tree.
 *
 * Note, if you would only ever be calling this with the same args, it is best practice
 * to capture those args in a closure by making generator `() => (realTarget(args))` and
 * then calling the trigger with (). This will optimize "needs refresh" check.
 *
 * TODO:
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
): LazySuspensionReaders<Result, Args> {
  const rig = useNearestSuspensionRig();

  // If our parent rig exists but isn't mounted yet, wait until it finishes and try again.
  if (isPromise(rig)) {
    throw rig;
  }

  const cacheLoader = useGetCacheLoader(generator, cacheKey, options);

  const uncastSuspenseReader: (...a: Args) => Result = useCallback(
    (...a: Args) => {
      const status = cacheLoader(...a);
      if (status.status === CallStatus.success) {
        return status.result;
      }

      if (status.status === CallStatus.loading) {
        throw status.promise;
      }

      // If we don't have a success or in-progress under our belts,
      // it was unstarted or a failure. We should start a new one.
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

      throw newResultsPromise;
    },
    [cacheLoader, generator, cacheKey]
  );

  const uncastReaderFunction: (...a: Args) => Result | undefined = useCallback(
    (...a: Args) => {
      const status = cacheLoader(...a);
      if (status.status === CallStatus.success) {
        return status.result;
      }

      if (status.status === CallStatus.loading) {
        throw status.promise;
      } else if (status.status === CallStatus.failed) {
        throw new SuspensionResolutionFailedError(status.error, () => {
          const r = uncastSuspenseReader(...a);
          // If it's a success, we still want the retry to look like a retry
          throw Promise.resolve(r);
        });
      }

      // Otherwise, we haven't loaded a thing yet
      return undefined;
    },
    [cacheLoader, uncastSuspenseReader]
  );

  // NOTE I should research this cast to make sure it's 100% safe, but
  // testing it in modern Chrome and FF does confirm that there at least
  // it is, indeed, equivalent to say `(...a: []) => R` and `() => R`.
  // Which means that this cast SHOULD be ok? #famouslastwords
  const readerF = uncastReaderFunction as FunctionWithArgs<Args, Result | undefined>;
  const suspenseF = uncastSuspenseReader as FunctionWithArgs<Args, Result>;

  return [readerF, suspenseF];
}
