export default "This module should not be require()'d";

/// Exporting utility types you might want to use in Typescript:
export type { LazySuspendableResult, Suspendable, SuspendableWithArgs } from "./@types";
/// The thrown error type of a failure, with a captured retry trigger.
export { SuspensionResolutionFailedError, SuspensionWithoutContextError } from "./Errors";
// The hooks you will use
export { useLazySuspension, useSuspension } from "./hooks";
/// Options you can pass to the hooks
export type { RefreshIsNeededCheck, SuspensionOptions } from "./options/SuspensionOptions";
/// The wrapper rig for the hooks:
export { SuspensionRig, ErrorBoundary } from "./SuspensionRig";
