import React, { PropsWithChildren, Suspense } from "react";
import { SuspensionRig } from "../../SuspensionRig";

export default function TestRig({ children }: PropsWithChildren<{}>) {
  return (
    <SuspensionRig>
      <Suspense fallback={<div>Did fallback</div>}>{children}</Suspense>
    </SuspensionRig>
  );
}
