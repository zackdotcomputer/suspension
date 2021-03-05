import { createContext } from "react";
import { RigCacheViewer } from "./SuspensionCache/RigCacheViewer";

export const UNATTACHED_CONTEXT = Symbol("UNATTACHED_CONTEXT");
const SuspensionRigContext = createContext<RigCacheViewer | Promise<RigCacheViewer>>(
  UNATTACHED_CONTEXT as any
);

export default SuspensionRigContext;
