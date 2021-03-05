import { CallState } from "./CallState";
import FunctionWithArgs from "./FunctionWithArgs";

/**
 * The result of a successful lazy suspension call is an array with three elements.
 * - The first one will be undefined if the trigger function has never been
 *   called or a result value if the trigger function has been called and resolved.
 * - The second element is the trigger function, which will trigger a new attempt
 *   to resolve the desired data.
 * - The third element is the rich state for the call, in case you need more data
 *   than just the resulting value. (E.G. if the result is expected to be undefined).
 */
export type LazySuspendableResult<Result, Args extends any[] = []> = [
  Result | undefined,
  FunctionWithArgs<Args, Promise<Result>>,
  CallState<Result>
];
