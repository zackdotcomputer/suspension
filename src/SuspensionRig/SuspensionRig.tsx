import React, { PropsWithChildren, useEffect, useState } from "react";
import SuspensionCache from "./SuspensionCache";
import { makeRigCacheViewer, RigCacheViewer } from "./SuspensionCache/RigCacheViewer";
import SuspensionRigContext from "./SuspensionRigContext";

export default function SuspensionRig({ children }: PropsWithChildren<{}>) {
  const [rigViewer, setRigViewer] = useState<RigCacheViewer | Promise<RigCacheViewer>>(null as any);

  // If we're instantiated but not yet mounted, make a promise for when we are ready.
  let promiseResolver: null | ((viewer: RigCacheViewer) => void) = null;
  if (!rigViewer) {
    const whenReady = new Promise<RigCacheViewer>((resolver) => {
      promiseResolver = resolver;
    });
    setRigViewer(whenReady);
  }
  const [rigPromiseResolver, setRigPromiseResolver] = useState<
    ((viewer: RigCacheViewer) => void) | null
  >(promiseResolver);

  useEffect(() => {
    const myRigId = SuspensionCache.shared().connect();
    const newViewer = makeRigCacheViewer(myRigId);
    setRigViewer(newViewer);

    if (rigPromiseResolver) {
      rigPromiseResolver(newViewer);
      setRigPromiseResolver(null);
    }

    return () => {
      // TODO: Maybe this should be optional?
      SuspensionCache.shared().destroy(myRigId);
    };
  }, []);

  return (
    <SuspensionRigContext.Provider value={rigViewer}>{children}</SuspensionRigContext.Provider>
  );
}
