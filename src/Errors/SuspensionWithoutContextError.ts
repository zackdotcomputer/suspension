const SuspensionWithoutContextErrorName = "SuspensionWithoutContextError";

/**
 * The Error type that is thrown by the hooks in the event they are called from
 * a component which is not a descendent of the `SuspensionRig` component.
 */
export default class SuspensionWithoutContextError extends Error {
  name: typeof SuspensionWithoutContextErrorName;

  constructor() {
    super(
      "You have called a suspension hook from a component that was not a descendent of `SuspensionRig`. You must put a `SuspensionRig` higher in your tree."
    );
    this.name = SuspensionWithoutContextErrorName;
  }
}
