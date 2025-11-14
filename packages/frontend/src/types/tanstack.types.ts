/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  DefaultError,
  DefinedInitialDataOptions,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
  UseQueryOptions as TanstackUseQueryOptions,
  UseInfiniteQueryOptions,
  UseMutateFunction,
  UseMutationOptions,
} from "@tanstack/react-query";

interface UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends TanstackUseQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  onError?: (err: DefaultError | null) => void;
  onSuccess?: (data: TQueryFnData) => void;
}

export type {
  DefaultError,
  DefinedInitialDataOptions,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
  UseInfiniteQueryOptions,
  UseMutateFunction,
  UseMutationOptions,
  UseQueryOptions,
};
