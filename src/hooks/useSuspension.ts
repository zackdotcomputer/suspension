import isPromise from "is-promise";
import { CallStatus, FunctionWithArgs, Suspendable } from "../@types";
import { SuspensionResolutionFailedError } from "../Errors";
import { SuspensionOptions } from "../options/SuspensionOptions";
import { useNearestSuspensionRig } from "../SuspensionRig";
import useGetCacheLoader from "./useGetCacheLoader";

/**
 * Allows you to transform a promise or promise-returning function into one which will
 * trigger Suspense and ErrorBoundary components in your React tree. This hook will
 * attempt the resolution of your generator immediately.
 *
 * @param generator The promise or promise-returning function you would like to link to
 *   Suspense. You can pass in either an already-in-flight Promise, a function that takes
 *   no parameters and returns a Promise, or (for legacy reasons) a function that takes
 *   no parameters and returns a resolved value. Note that all of these will cause at least
 *   one render cycle where Suspense components fallback.
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
 * @param args If your generator takes arguments, pass them as an array at call time.
 * @param options Custom `SuspensionOptions` for this linkage.
 * @returns The resolved value from your generator Suspendable. This hook will ALWAYS either
 *   return the fully-resolved value or else throw (see below).
 * @throws Per the Concurrent model, this function will throw a Promise if the resolution
 *   is actively in progress, which will be caught by the next highest Suspense component.
 *   If the resolution has failed, this function will throw a `SuspensionResolutionFailedError`,
 *   which contains the underlying error and a retry function.
 */
function useSuspension<Result, Args extends [] = []>(
  generator: Suspendable<Result, Args>,
  cacheKey: string,
  options?: SuspensionOptions
): Result;
function useSuspension<Result, Args extends any[]>(
  generator: Suspendable<Result, Args>,
  cacheKey: string,
  args: Args,
  options?: SuspensionOptions
): Result;
function useSuspension<Result, Args extends any[] = []>(
  generator: Suspendable<Result, Args>,
  cacheKey: string,
  argsOrOptions?: Args | SuspensionOptions,
  optionsOpt?: SuspensionOptions
): Result {
  const rig = useNearestSuspensionRig();

  // If our parent rig exists but isn't mounted yet, wait until it finishes and try again.
  if (isPromise(rig)) {
    throw rig;
  }

  // The options to use are either the options if we got them in slot 4, or the value in slot
  // 3 unless it's an args array.
  const optionsToUse = optionsOpt ?? Array.isArray(argsOrOptions) ? undefined : argsOrOptions;

  // It's unclear why but something about my weird hacks around Args being empty causes TS to
  // die here. Casting fixed it.
  const argsToUse: Args = (Array.isArray(argsOrOptions) ? argsOrOptions : []) as Args;

  const uncastWrappedGenerator = (...args: Args): Promise<Result> => {
    // Digest the different kinds of Suspendable<R> to all be Promise<R>
    const suspendMe = typeof generator === "function" ? generator(...args) : generator;
    return isPromise(suspendMe) ? suspendMe : Promise.resolve(suspendMe);
  };
  const wrappedGenerator = uncastWrappedGenerator as FunctionWithArgs<Args, Promise<Result>>;

  const cacheLoader = useGetCacheLoader(wrappedGenerator, cacheKey, optionsToUse);

  const status = cacheLoader(...argsToUse);
  if (status.status === CallStatus.success) {
    return status.result;
  }

  if (status.status === CallStatus.loading) {
    throw status.promise;
  }

  if (status.status === CallStatus.failed) {
    throw new SuspensionResolutionFailedError(status.error, () => {
      rig.clearCall(cacheKey);
      const result = useSuspension(generator, cacheKey, argsToUse, optionsToUse);
      throw Promise.resolve(result);
    });
  }

  // Ok, no success, loading, or failure means start a new call.
  const newResultsPromise = wrappedGenerator(...argsToUse);

  rig.startCall({
    key: cacheKey,
    args: argsToUse,
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
}

export default useSuspension;
