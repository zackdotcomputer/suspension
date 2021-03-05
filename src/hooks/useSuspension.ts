import isPromise from "is-promise";
import { CallStatus, Suspendable } from "../@types";
import { SuspensionOptions } from "../options/SuspensionOptions";
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
 * @param options Custom `SuspensionOptions` for this linkage.
 * @returns The resolved value from your generator Suspendable. This hook will ALWAYS either
 *   return the fully-resolved value or else throw (see below).
 * @throws Per the Concurrent model, this function will throw a Promise if the resolution
 *   is actively in progress, which will be caught by the next highest Suspense component.
 *   If the resolution has failed, this function will throw a `SuspensionResolutionFailedError`,
 *   which contains the underlying error and a retry function.
 */
export default function useSuspension<Result>(
  generator: Suspendable<Result>,
  cacheKey: string,
  options?: SuspensionOptions
): Result {
  const [, startCallF, fullStatus] = useLazySuspension<Result>(
    (): Promise<Result> => {
      // Digest the different kinds of Suspendable<R> to all be Promise<R>
      const suspendMe = typeof generator === "function" ? generator() : generator;
      return isPromise(suspendMe) ? suspendMe : Promise.resolve(suspendMe);
    },
    cacheKey,
    options
  );

  // If the above call didn't throw on its own, we either are already resolved
  // or haven't started.
  if (fullStatus.status === CallStatus.success) {
    return fullStatus.result;
  } else {
    throw startCallF();
  }
}
