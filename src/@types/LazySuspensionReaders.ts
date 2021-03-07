import FunctionWithArgs from "./FunctionWithArgs";

/**
 * The result of a lazy suspension call is an array with two elements.
 * - The first one is your lazy reader function. It will return the value if it has
 *   been cached successfully with the provided args, undefined if it hasn't been,
 *   or it will throw a promise or error if the attempt is in a loading or error
 *   state.
 * - The second element is the active reader function. It is the same as the lazy
 *   reader except that the unstarted and failed cases (undefined and thrown Error)
 *   will instead start a new call to your generator and throw the resulting promise.
 */
export type LazySuspensionReaders<Result, Args extends any[] = []> = [
  FunctionWithArgs<Args, Result | undefined>,
  FunctionWithArgs<Args, Result>
];
