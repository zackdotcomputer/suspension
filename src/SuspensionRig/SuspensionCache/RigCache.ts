import { CallState, SuspendableWithArgs } from "../../@types";

export interface CachePoint<Result, Args extends any[]> {
  callState: CallState<Result>;
  lastCallArgs: Args | null;
  generator: SuspendableWithArgs<Result, Args>;
}

export interface RigCache {
  [key: string]: CachePoint<any, any> | undefined;
}
