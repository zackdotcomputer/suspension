import { CallStatus } from "../../@types";
import { CreateCallPayload, ResolveCallPayload, StartCallPayload } from "./CacheCallPayloads";
import { CachePoint, RigCache } from "./RigCache";

// Very big number but still safely less than Number.MAX_SAFE_INTEGER
const maxRigId: number = 8000000000000000;

/** Singleton variable for the Cache */

// eslint-disable-next-line
let __SINGLE_SUSPENSION_CACHE__: SuspensionCache | undefined;

export default class SuspensionCache {
  rigData: { [key: number]: RigCache | undefined } = {};

  /* Top level database functions */
  connect(): number {
    const newId = Math.round(Math.random() * maxRigId);

    this.rigData[newId] = this.rigData[newId] ?? {};

    return newId;
  }

  destroy(id: number) {
    this.rigData[id] = undefined;
  }

  resetAll() {
    this.rigData = {};
  }

  /* Actions on an individual rig cache */
  value<Result, Args extends any[]>(
    rig: number,
    callKey: string
  ): CachePoint<Result, Args> | undefined {
    const rigData = this.rigData[rig];
    if (!rigData) {
      throw new Error("SuspensionCache - no rig of that ID");
    }

    return rigData[callKey];
  }

  initializeCall(rig: number, call: CreateCallPayload) {
    const rigData = this.rigData[rig];
    if (!rigData) {
      throw new Error("SuspensionCache - no rig of that ID");
    }

    const rigPoint = rigData[call.key];

    if (!rigPoint) {
      rigData[call.key] = {
        callState: { status: CallStatus.unstarted },
        lastCallArgs: null,
        generator: call.generator
      };
    } else if (rigPoint.generator !== call.generator) {
      rigPoint.generator = call.generator;
    }
  }

  startCall<Result, Args extends any[]>(rig: number, call: StartCallPayload<Result, Args>) {
    const rigData = this.rigData[rig];
    if (!rigData) {
      throw new Error(`SuspensionCache - no rig of ID ${rig}`);
    }

    const rigPoint = rigData[call.key];

    if (!rigPoint) {
      throw new Error(`SuspensionCache - no call with key ${call.key}`);
    }

    rigPoint.lastCallArgs = call.args;
    rigPoint.callState = {
      status: CallStatus.loading,
      promise: call.promise
    };
  }

  resolveCall<Result>(rig: number, call: ResolveCallPayload<Result>) {
    const rigData = this.rigData[rig];
    if (!rigData) {
      throw new Error(`SuspensionCache - no rig of ID ${rig}`);
    }

    const rigPoint = rigData[call.key];

    if (!rigPoint) {
      throw new Error(`SuspensionCache - no call with key ${call.key}`);
    }

    if (
      rigPoint.callState.status !== CallStatus.loading ||
      rigPoint.callState.promise !== call.promise
    ) {
      // Abandon the resolution because we're trying to resolve the wrong promise.
      return;
    }

    rigPoint.callState = call.resolution;
  }

  clearCall(rig: number, callKey: string) {
    const rigData = this.rigData[rig];
    if (!rigData) {
      throw new Error("SuspensionCache - no rig of that ID");
    }

    rigData[callKey] = undefined;
  }

  /** Singleton getter */
  static shared(): SuspensionCache {
    if (__SINGLE_SUSPENSION_CACHE__) {
      return __SINGLE_SUSPENSION_CACHE__;
    } else {
      const inst = new SuspensionCache();
      __SINGLE_SUSPENSION_CACHE__ = inst;
      return inst;
    }
  }
}
