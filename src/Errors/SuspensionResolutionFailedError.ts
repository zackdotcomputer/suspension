const SuspensionResolutionFailedErrorName = "SuspensionResolutionFailedError";

/**
 * The Error type that is thrown by the hooks in the event that the last access attempt failed.
 * You can and should catch this type using an ErrorBoundary and offer a "retry" button for the
 * user if appropriate using the `retryFunction` property. Calling this function will reset
 * and reattempt the resolution.
 */
export default class SuspensionResolutionFailedError<RetryFunction> extends Error {
  name: typeof SuspensionResolutionFailedErrorName;

  underlyingError: Error;

  retryFunction: RetryFunction;

  constructor(underlyingError: Error, retryFunction: RetryFunction) {
    super(underlyingError.message);
    this.name = SuspensionResolutionFailedErrorName;
    this.underlyingError = underlyingError;
    this.retryFunction = retryFunction;
  }
}
