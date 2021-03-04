import isPromise from "is-promise";
import { Suspendable } from "./@types/Suspendable";
import { SuspensionOptions } from "./options/SuspensionOptions";
import useLazySuspension from "./useLazySuspension";

/**
 * Allows you to transform a promise or promise-returning function into one which will
 * trigger Suspense and ErrorBoundary components in your React tree. This hook will
 * attempt the resolution of your target immediately.
 *
 * @param target The promise or promise-returning function you would like to link to
 *   Suspense. You can pass in either an already-in-flight Promise, a function that takes
 *   no parameters and returns a Promise, or (for legacy reasons) a function that takes
 *   no parameters and returns a resolved value. Note that all of these will cause at least
 *   one render cycle where Suspense components fallback.
 * @param options Custom `SuspensionOptions` for this linkage.
 * @returns The resolved value from your target Suspendable. This hook will ALWAYS either
 *   return the fully-resolved value or else throw (see below).
 * @throws Per the Concurrent model, this function will throw a Promise if the resolution
 *   is actively in progress, which will be caught by the next highest Suspense component.
 *   If the resolution has failed, this function will throw a `SuspensionResolutionFailedError`,
 *   which contains the underlying error and a retry function.
 */
export default function useSuspension<Result>(
  target: Suspendable<Result>,
  options?: SuspensionOptions
): Result {
  const [result, startCallF] = useLazySuspension<Result>((): Promise<Result> => {
    // Digest the different kinds of Suspendable<R> to all be Promise<R>
    const suspendMe = typeof target === "function" ? target() : target;
    return isPromise(suspendMe) ? suspendMe : Promise.resolve(suspendMe);
  }, options);

  // If the above call didn't throw on its own, we either are already resolved
  // or haven't started.
  if (result) {
    return result;
  } else {
    throw startCallF();
  }
}
