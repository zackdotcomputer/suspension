import { useContext } from "react";
import { SuspensionWithoutContextError } from "../Errors";
import { RigCacheViewer } from "./SuspensionCache/RigCacheViewer";
import SuspensionRigContext, { UNATTACHED_CONTEXT } from "./SuspensionRigContext";

export default function useNearestSuspensionRig(): RigCacheViewer | Promise<RigCacheViewer> {
  const rigContext = useContext(SuspensionRigContext);
  if ((rigContext as any) === UNATTACHED_CONTEXT) {
    throw new SuspensionWithoutContextError();
  }

  return rigContext;
}
