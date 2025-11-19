/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

import type {
  DefaultError,
  InfiniteData,
  QueryKey,
} from "@/types/tanstack.types";

export const useTanstackQuery = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Parameters<
    typeof useQuery<TQueryFnData, TError, TData, TQueryKey>
  >[0] & {
    onError?: (err: TError | null) => void;
    onSuccess?: (data: TData) => void;
  },
  queryClient?: Parameters<typeof useQuery>[1],
) => {
  const { onError, onSuccess, ...restOptions } = options;
  const result = useQuery(restOptions, queryClient);

  useEffect(() => {
    result.isError && onError?.(result.error);
  }, [result.error, result.isError]);

  useEffect(() => {
    result.isSuccess && onSuccess?.(result.data);
  }, [result.data, result.isSuccess]);

  return result;
};

export const useTanstackQueryClient = (
  queryClient?: Parameters<typeof useQueryClient>[0],
) => useQueryClient(queryClient);

export const useTanstackMutation = <
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: Parameters<
    typeof useMutation<TData, TError, TVariables, TOnMutateResult>
  >[0],
  queryClient?: Parameters<typeof useMutation>[1],
) => {
  return useMutation(options, queryClient);
};

export const useTanstackInfiniteQuery = <
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: Parameters<
    typeof useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>
  >[0],
  queryClient?: Parameters<typeof useInfiniteQuery>[1],
) => useInfiniteQuery(options, queryClient);
