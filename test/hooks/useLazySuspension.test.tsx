import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { SuspensionWithoutContextError } from "../../src/Errors";
import { useLazySuspension } from "../../src/hooks";
import TestRig from "./TestRig";

/* eslint-disable no-console */

describe("useLazySuspension hook - no args", () => {
  afterEach(cleanup);

  function LazySuspenseTest({
    suspendable,
    shouldTriggerHook,
    refreshDisriminator
  }: {
    suspendable: () => Promise<string>;
    shouldTriggerHook?: boolean;
    refreshDisriminator?: () => boolean;
  }) {
    const [result, hook] = useLazySuspension(suspendable, "test-suspension", {
      alwaysLoadingInSSR: false,
      shouldRefreshData: refreshDisriminator
    });
    if (shouldTriggerHook && hook) {
      hook();
    }
    return <span>{result}</span>;
  }

  const getTestPromise = (): [jest.Mock<Promise<string>, []>, Promise<string>] => {
    const testPromise = Promise.resolve("it worked");
    return [jest.fn(() => testPromise), testPromise];
  };

  it("requires a Rig", () => {
    const [testPromiseSuspendable] = getTestPromise();

    jest.spyOn(console, "error");
    (console.error as any).mockImplementation(() => {});

    expect(() => {
      render(<LazySuspenseTest suspendable={testPromiseSuspendable} />);
    }).toThrow(new SuspensionWithoutContextError());

    expect(testPromiseSuspendable).toBeCalledTimes(0);

    (console.error as any).mockRestore();
  });

  it("doesn't start automatically", () => {
    const [testPromiseSuspendable] = getTestPromise();
    const result = render(<TestRig />);
    result.rerender(
      <TestRig>
        <LazySuspenseTest suspendable={testPromiseSuspendable} />
      </TestRig>
    );
    expect(result.baseElement.innerHTML).toBe("<div><span></span></div>");
    expect(testPromiseSuspendable).toBeCalledTimes(0);
  });

  it("does start on demand", () => {
    const [testPromiseSuspendable] = getTestPromise();
    const result = render(<TestRig />);
    result.rerender(
      <TestRig>
        <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
      </TestRig>
    );
    expect(screen.getByText("Did fallback")).toBeDefined();
    expect(testPromiseSuspendable).toBeCalledTimes(1);
  });

  it("does resolve", () => {
    const [testPromiseSuspendable, testPromise] = getTestPromise();
    const result = render(<TestRig />);
    result.rerender(
      <TestRig>
        <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
      </TestRig>
    );

    return testPromise.then((str: string) => {
      result.rerender(
        <TestRig>
          <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
        </TestRig>
      );

      expect(screen.getByText(str)).toBeDefined();
      expect(testPromiseSuspendable).toBeCalledTimes(1);
    });
  });

  it("does cache resolutions", () => {
    const [testPromiseSuspendable, testPromise] = getTestPromise();
    const result = render(<TestRig />);
    result.rerender(
      <TestRig>
        <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
      </TestRig>
    );

    return testPromise.then((str: string) => {
      result.rerender(
        <TestRig>
          <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
        </TestRig>
      );

      result.rerender(
        <TestRig>
          <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
        </TestRig>
      );

      result.rerender(
        <TestRig>
          <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
        </TestRig>
      );

      expect(screen.getByText(str)).toBeDefined();
      expect(testPromiseSuspendable).toBeCalledTimes(1);
    });
  });

  it("listens to the refresh hook", () => {
    const [testPromiseSuspendable, testPromise] = getTestPromise();
    const refreshHook = jest.fn(() => false);
    const result = render(<TestRig />);
    result.rerender(
      <TestRig>
        <LazySuspenseTest
          suspendable={testPromiseSuspendable}
          shouldTriggerHook={true}
          refreshDisriminator={refreshHook}
        />
      </TestRig>
    );

    return testPromise.then((str: string) => {
      result.rerender(
        <TestRig>
          <LazySuspenseTest
            suspendable={testPromiseSuspendable}
            shouldTriggerHook={true}
            refreshDisriminator={refreshHook}
          />
        </TestRig>
      );

      result.rerender(
        <TestRig>
          <LazySuspenseTest
            suspendable={testPromiseSuspendable}
            shouldTriggerHook={true}
            refreshDisriminator={refreshHook}
          />
        </TestRig>
      );

      expect(screen.getByText(str)).toBeDefined();
      expect(testPromiseSuspendable).toBeCalledTimes(1);

      refreshHook.mockClear();
      refreshHook.mockReturnValue(true);

      result.rerender(
        <TestRig>
          <LazySuspenseTest
            suspendable={testPromiseSuspendable}
            shouldTriggerHook={true}
            refreshDisriminator={refreshHook}
          />
        </TestRig>
      );

      expect(refreshHook).toBeCalledTimes(1);
      expect(screen.getByText("Did fallback")).toBeDefined();
      expect(testPromiseSuspendable).toBeCalledTimes(2);
    });
  });
});
