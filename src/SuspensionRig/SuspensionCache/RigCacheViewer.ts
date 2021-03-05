import { CreateCallPayload, ResolveCallPayload, StartCallPayload } from "./CacheCallPayloads";
import { CachePoint } from "./RigCache";
import SuspensionCache from "./SuspensionCache";

export interface RigCacheViewer {
  value<Result, Args extends any[]>(callKey: string): CachePoint<Result, Args> | undefined;

  initializeCall(call: CreateCallPayload): void;

  startCall<Result, Args extends any[]>(call: StartCallPayload<Result, Args>): void;

  resolveCall<Result>(call: ResolveCallPayload<Result>): void;

  clearCall(callKey: string): void;
}

export function makeRigCacheViewer(rigId: number): RigCacheViewer {
  return {
    value: (callKey) => {
      return SuspensionCache.shared().value(rigId, callKey);
    },
    initializeCall: (callInfo) => {
      return SuspensionCache.shared().initializeCall(rigId, callInfo);
    },
    startCall: (callInfo) => {
      return SuspensionCache.shared().startCall(rigId, callInfo);
    },
    resolveCall: (callInfo) => {
      return SuspensionCache.shared().resolveCall(rigId, callInfo);
    },
    clearCall: (callKey) => {
      return SuspensionCache.shared().clearCall(rigId, callKey);
    }
  };
}
