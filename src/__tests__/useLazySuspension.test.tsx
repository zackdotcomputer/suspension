import { render } from "@testing-library/react";
import React from "react";
import useLazySuspension from "../useLazySuspension";

describe("lazy hook no args", () => {
  function LazySuspenseTest({
    suspendable,
    shouldTriggerHook
  }: {
    suspendable: () => Promise<string>;
    shouldTriggerHook?: boolean;
  }) {
    const [result, hook] = useLazySuspension(suspendable, { alwaysLoadingInSSR: false });

    if (hook && shouldTriggerHook) {
      hook();
    }

    return <span>{result}</span>;
  }

  const getTestPromise = (): [() => Promise<string>, Promise<string>] => {
    const testPromise = Promise.resolve("it worked");
    return [() => testPromise, testPromise];
  };

  it("doesn't start automatically", () => {
    const [testPromiseSuspendable] = getTestPromise();
    const rendered = render(<LazySuspenseTest suspendable={testPromiseSuspendable} />);

    expect(rendered.baseElement.innerHTML).toBeNull();
  });

  // it("does start on demand", () => {
  //   const [testPromiseSuspendable] = getTestPromise();

  //   const rendered = TestRenderer.create(
  //     <Suspense fallback={<div>Did fallback</div>}>
  //       <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
  //     </Suspense>
  //   );
  //   expect((rendered.toJSON() as any).children[0]).toBe("Did fallback");
  // });

  // it("resolves", () => {
  //   const [testPromiseSuspendable, testPromise] = getTestPromise();
  //   const testComponent = (
  //     <Suspense fallback={<div>Did fallback</div>}>
  //       <LazySuspenseTest suspendable={testPromiseSuspendable} shouldTriggerHook={true} />
  //     </Suspense>
  //   );

  //   let tree: TestRenderer.ReactTestRenderer = TestRenderer.create(testComponent);

  //   return TestRenderer.act(async () => {
  //     await testPromise;
  //   }).then(() => {
  //     tree.update(testComponent);
  //     console.debug(tree.toJSON());
  //     expect((tree.toJSON() as any).children[0]).toBe("it worked");
  //   });
  // });
});
