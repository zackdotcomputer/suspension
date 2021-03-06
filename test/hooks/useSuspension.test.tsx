import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { SuspensionWithoutContextError } from "../../src";
import { useSuspension } from "../../src";
import TestRig from "./TestRig";

/* eslint-disable no-console */

describe("useSuspension hook", () => {
  afterEach(cleanup);

  function SuspenseTest({ suspendable }: { suspendable: () => Promise<string> }) {
    const result = useSuspension(suspendable, "test-suspension", {
      alwaysLoadingInSSR: false
    });
    return <span>{result}</span>;
  }

  const getTestPromise = (): [jest.Mock<Promise<string>, []>, Promise<string>] => {
    const testPromise = Promise.resolve("worked");
    return [jest.fn(() => testPromise), testPromise];
  };

  it("requires a Rig", () => {
    const [testPromiseSuspendable] = getTestPromise();

    jest.spyOn(console, "error");
    (console.error as any).mockImplementation(() => {});

    expect(() => {
      render(<SuspenseTest suspendable={testPromiseSuspendable} />);
    }).toThrow(new SuspensionWithoutContextError());

    (console.error as any).mockRestore();
  });

  it("does start automatically", () => {
    const [testPromiseSuspendable] = getTestPromise();
    const result = render(<TestRig />);
    result.rerender(
      <TestRig>
        <SuspenseTest suspendable={testPromiseSuspendable} />
      </TestRig>
    );
    result.rerender(
      <TestRig>
        <SuspenseTest suspendable={testPromiseSuspendable} />
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
        <SuspenseTest suspendable={testPromiseSuspendable} />
      </TestRig>
    );

    return testPromise.then((str: string) => {
      result.rerender(
        <TestRig>
          <SuspenseTest suspendable={testPromiseSuspendable} />
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
        <SuspenseTest suspendable={testPromiseSuspendable} />
      </TestRig>
    );

    return testPromise.then((str: string) => {
      result.rerender(
        <TestRig>
          <SuspenseTest suspendable={testPromiseSuspendable} />
        </TestRig>
      );

      result.rerender(
        <TestRig>
          <SuspenseTest suspendable={testPromiseSuspendable} />
        </TestRig>
      );

      result.rerender(
        <TestRig>
          <SuspenseTest suspendable={testPromiseSuspendable} />
        </TestRig>
      );

      expect(screen.getByText(str)).toBeDefined();
      expect(testPromiseSuspendable).toBeCalledTimes(1);
    });
  });
});
