import React, { PropsWithChildren, Suspense, SuspenseProps, useEffect, useState } from "react";
import { ErrorBoundary, ErrorBoundaryProps } from "react-error-boundary";
import { makeRigCacheViewer, RigCacheViewer, SuspensionCache } from "./SuspensionCache";
import SuspensionRigContext from "./SuspensionRigContext";

type PropsForErrorHandling = {
  errorBoundary: ErrorBoundaryProps;
};

type PropsForSuspenseHandling = Partial<Pick<SuspenseProps, "fallback">>;

export type Props = PropsWithChildren<{}> &
  PropsForSuspenseHandling &
  Partial<PropsForErrorHandling>;

/**
 * The SuspensionRig provides a context for suspension hooks to cache data about their
 * calls upon. It can also act as your Suspense barrier if you provide the fallback prop.
 * It can also act as your ErrorBoundary if you provide the errorBoundary prop containing
 * an object of props for react-error-boundary.
 */
export default function SuspensionRig({ children, fallback, errorBoundary }: Props) {
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

  const suspenseWrapping = fallback ? (
    <Suspense fallback={fallback}>{children}</Suspense>
  ) : (
    children
  );

  console.debug("Error", errorBoundary);
  const errorWrapping =
    errorBoundary !== undefined ? (
      <>
        <div>errrrrr</div>
        <ErrorBoundary {...errorBoundary}>{suspenseWrapping}</ErrorBoundary>
      </>
    ) : (
      suspenseWrapping
    );

  return (
    <SuspensionRigContext.Provider value={rigViewer}>{errorWrapping}</SuspensionRigContext.Provider>
  );
}
