import { UseResourceResponse } from "./resource";

interface FetchingCallbackResponse<DATA> extends UseResourceResponse<DATA> {
  refetch: () => void;
}

export interface FetchingCallbackResponseArray<DATA, PARAM>
  extends UseResourceResponse<DATA> {
  refetch: (...arg: PARAM[]) => void;
}

interface FetchingCallbackResponseV<DATA, PARAM>
  extends UseResourceResponse<DATA> {
  refetch: (arg: PARAM) => void;
}

interface FetchingCallbackResponseV2<DATA, PARAM1, PARAM2>
  extends UseResourceResponse<DATA> {
  refetch: (arg1: PARAM1, arg2: PARAM2) => void;
}

export type UseFetchingCallback = {
  <T>(fetchFunc: () => Promise<T>): FetchingCallbackResponse<T>;
  <T, V>(fetchFunc: (param: V) => Promise<T>): FetchingCallbackResponseV<T, V>;
  <T, V1, V2>(
    fetchFunc: (v1: V1, v2: V2) => Promise<T>,
  ): FetchingCallbackResponseV2<T, V1, V2>;
  <T, V>(
    fetchFunc: (...param: V[]) => Promise<T>,
  ): FetchingCallbackResponseArray<T, V>;
};