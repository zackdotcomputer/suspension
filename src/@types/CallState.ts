export enum CallStatus {
  unstarted = "unstarted",
  loading = "loading",
  success = "success",
  failed = "failed"
}

export interface UnstartedCallState {
  status: CallStatus.unstarted;
}

export interface LoadingCallState<R> {
  status: CallStatus.loading;
  promise: Promise<R>;
}

export interface ErrorCallState {
  status: CallStatus.failed;
  error: Error;
}

export interface SuccessCallState<Result> {
  status: CallStatus.success;
  result: Result;
}

export type CallState<R> =
  | UnstartedCallState
  | LoadingCallState<R>
  | ErrorCallState
  | SuccessCallState<R>;
