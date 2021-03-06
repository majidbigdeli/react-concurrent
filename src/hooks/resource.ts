import { useState, useLayoutEffect, useCallback, useRef } from "react";
import {
  UseResourceResponse,
  Resource,
  RESOURCE_RESOLVED,
  RESOURCE_REJECTED,
  RESOURCE_PENDING,
  UseCreateResource,
} from "../types";
import { AsyncReturnType } from "../types/utils";
import { createResource } from "../resource";
import { areHookInputsEqual } from "../utilities/areHookInputsEqual";

/**
 * This function allow to use resource without React.Suspense.
 *
 * @example
 *   const { data = [], isLoading, error } = useResource(resource, onError);
 */
function useResource<V extends (...args: any) => any>(
  resource: Resource<V>,
): UseResourceResponse<AsyncReturnType<V>> {
  const [, forceUpdate] = useState({});

  const { data, error, isLoading } = _destructorResource(resource);

  useLayoutEffect(() => {
    let destructed = false;

    const update = () => !destructed && forceUpdate({});

    _listenerToResource(resource, { data, error, isLoading }, update);

    return () => {
      destructed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return { data, isLoading, error };
}

function _destructorResource(source: Resource<any>) {
  source.preload();

  let data;
  let error;
  let isLoading;
  if (source.status === RESOURCE_RESOLVED) {
    data = source.value;
    isLoading = false;
  } else if (source.status === RESOURCE_REJECTED) {
    isLoading = false;
    error = source.value;
  } else {
    isLoading = true;
  }

  return {
    data,
    error,
    isLoading,
  };
}

function _listenerToResource(
  resource: Resource<any>,
  resolved: UseResourceResponse<any>,
  callback: () => void,
) {
  if (
    resource.status === RESOURCE_RESOLVED &&
    resolved.data !== resource.value
  ) {
    callback();
  } else if (resource.status === RESOURCE_PENDING) {
    resource.value.then(callback);
  }
}

const emptyResource = createResource(() => undefined);

/**
 * A hook for creating resource without preloading
 *
 * @example
 *   const { resource, refetch } = useCreateResource(fetchApi, accountID, amount);
 *   resource.preload(); // if you need to preload data call this
 *
 * @param fetchFunc Promise returned function
 * @param arg This is fetchFunc arguments, if arguments changed function give
 *     another resource
 */
const useCreateResource: UseCreateResource = (
  fetchFunc,
  deps = [],
  {
    isEqual = areHookInputsEqual,
    isPreloadAfterCallRefetch = true,
    startFetchAtFirstRender = true,
  } = {},
) => {
  const [, forceUpdate] = useState({});

  const preDepsRef = useRef<any[]>(deps);
  const funcRef = useRef(fetchFunc);
  const resourceRef = useRef<Resource<any>>(emptyResource);

  if (funcRef.current !== fetchFunc) {
    funcRef.current = fetchFunc;
  }

  const isArgChanged = isEqual(deps, preDepsRef.current);

  if (!isArgChanged) {
    preDepsRef.current = deps;
  }

  if (
    !isArgChanged ||
    (resourceRef.current === emptyResource && startFetchAtFirstRender)
  ) {
    resourceRef.current = createResource(() => fetchFunc());
  }

  const refetch = useCallback(
    (...args: any) => {
      resourceRef.current = createResource(() => funcRef.current(...args));
      isPreloadAfterCallRefetch && resourceRef.current.preload();
      forceUpdate({});
    },
    [isPreloadAfterCallRefetch],
  );

  return { resource: resourceRef.current, refetch };
};

export { useResource, useCreateResource };
