export default "This module should not be require()'d";

/// Exporting utility types you might want to use in Typescript:
export type { LazySuspendableResult } from "./@types/LazySuspendableResult";
export type { Suspendable, SuspendableWithArgs } from "./@types/Suspendable";
/// The thrown error type of a failure, with a captured retry trigger.
export { default as SuspensionResolutionFailedError } from "./FailedError/SuspensionResolutionFailedError";
/// Options you can pass to the hooks
export type { RefreshIsNeededCheck, SuspensionOptions } from "./options/SuspensionOptions";
/// Exporting the hooks themselves:
export { default as useLazySuspension } from "./useLazySuspension";
export { default as useSuspension } from "./useSuspension";
