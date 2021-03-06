import isPromise from "is-promise";
import { CallStatus, FunctionWithArgs, Suspendable } from "../@types";
import { DefaultSuspensionOptions, SuspensionOptions } from "../options/SuspensionOptions";
import useLazySuspension from "./useLazySuspension";

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
  options?: SuspensionOptions
): Result {
  // The options to use are either the options if we got them in slot 4, or the value in slot
  // 3 unless it's an args array.
  const optionsToUse = options ?? Array.isArray(argsOrOptions) ? undefined : argsOrOptions;

  const argsToUse = (Array.isArray(argsOrOptions) ? argsOrOptions : undefined) ?? [];

  const wrappedGenerator: (...args: Args) => Promise<Result> = (...args: Args): Promise<Result> => {
    // Digest the different kinds of Suspendable<R> to all be Promise<R>
    const suspendMe = typeof generator === "function" ? generator(...args) : generator;
    return isPromise(suspendMe) ? suspendMe : Promise.resolve(suspendMe);
  };

  const [, startCallF, fullStatus] = useLazySuspension<Result, Args>(
    // Again, I think this should be a safe cast because of the flexibility of
    // ...args parameters for empty calls.
    wrappedGenerator as FunctionWithArgs<Args, Promise<Result>>,
    cacheKey,
    optionsToUse
  );

  const argsDiscriminator =
    optionsToUse?.shouldRefreshData ?? DefaultSuspensionOptions.shouldRefreshData;

  // If the above call didn't throw on its own, we either are already resolved
  // or haven't started. Check that the args didn't change and then roll ahead.
  if (
    fullStatus.lastCallState.status === CallStatus.success &&
    !argsDiscriminator(fullStatus.lastCallArgs, argsToUse)
  ) {
    return fullStatus.lastCallState.result;
  } else {
    throw startCallF(...argsToUse);
  }
}

export default useSuspension;
