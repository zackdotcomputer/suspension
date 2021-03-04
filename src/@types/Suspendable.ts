import FunctionWithArgs from "./FunctionWithArgs";

/**
 * A Suspendable is used for immediate resolution with Suspense via the useSuspension hook.
 * It can either be a promise for the result or an accessor function that will return
 * a promise for the result.
 * For compatability's sake with tools like Redux Thunks, accessor functions which return
 * the Result value directly are also supported and should resolve in two render cycles.
 */
export type Suspendable<Result> = Promise<Result> | (() => Promise<Result>) | (() => Result);

/**
 * A suspendable function which can be fed parameters (or no parameters) in exchange
 * for a Promise for some result.
 */
export type SuspendableWithArgs<Result, Args extends any[] = []> = FunctionWithArgs<
  Args,
  Promise<Result>
>;
