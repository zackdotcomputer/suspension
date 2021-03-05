/** Payloads for the various cache calls to this */

import { ErrorCallState, SuccessCallState, SuspendableWithArgs } from "../../@types";

export interface CreateCallPayload {
  key: string;
  generator: SuspendableWithArgs<any, any[]>;
}

export interface StartCallPayload<Result, Args extends any[]> {
  key: string;
  promise: Promise<Result>;
  args: Args;
}

export interface ResolveCallPayload<Result> {
  key: string;
  promise: Promise<Result>;
  resolution: SuccessCallState<Result> | ErrorCallState;
}
