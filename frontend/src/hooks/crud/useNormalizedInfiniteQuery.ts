/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useInfiniteQuery, UseInfiniteQueryOptions } from "react-query";

import {
  EntityType,
  Format,
  QueryType,
  TPopulateTypeFromFormat,
} from "@/services/types";
import {
  IBaseSchema,
  IDynamicProps,
  IFindConfigProps,
  POPULATE_BY_TYPE,
  TAllowedFormat,
  TType,
} from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";
import { toPageQueryPayload } from "../usePagination";

import { useNormalizeAndCache } from "./helpers";
import { useGetFromCache } from "./useGet";

const PAGE_SIZE = 20;

export const useNormalizedInfiniteQuery = <
  TDynamicProps extends IDynamicProps,
  TAttr = TType<TDynamicProps["entity"]>["attributes"],
  TBasic extends IBaseSchema = TType<TDynamicProps["entity"]>["basic"],
  TFull extends IBaseSchema = TType<TDynamicProps["entity"]>["full"],
  P = TPopulateTypeFromFormat<TDynamicProps>,
>(
  { entity, format }: TDynamicProps & TAllowedFormat<TDynamicProps["entity"]>,
  config?: IFindConfigProps,
  options?: Omit<
    UseInfiniteQueryOptions<
      string[],
      Error,
      string[],
      [QueryType, EntityType, any]
    >,
    "queryFn" | "queryKey" | "onSuccess"
  > & { onSuccess?: (result: TBasic[]) => void },
) => {
  const initialPaginationState = config?.initialPaginationState || {
    page: 0,
    pageSize: PAGE_SIZE,
  };
  const initialSortState = config?.initialSortState || [
    {
      field: "createdAt",
      sort: "asc",
    },
  ];
  const { onSuccess, ...otherOptions } = options || {};
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const normalizeAndCache = useNormalizeAndCache<TBasic | TFull, string[]>(
    entity,
  );
  const getFromCache = useGetFromCache(entity);
  const initialPageParams = toPageQueryPayload(
    initialPaginationState,
    initialSortState,
  );
  // @TODO : fix the following
  // @ts-ignore
  const { data: infiniteData, ...infiniteQuery } = useInfiniteQuery({
    queryKey: [QueryType.infinite, entity, config?.params],
    initialPageParam: {
      limit: PAGE_SIZE,
      skip: 0,
    },
    queryFn: async ({
      pageParam = {
        limit: PAGE_SIZE,
        skip: 0,
      },
    }) => {
      const data = await api.find(
        {
          ...(config?.params || {}),
          ...initialPageParams,
          ...pageParam,
        },
        format === Format.FULL && (POPULATE_BY_TYPE[entity] as P),
      );
      const { entities, result } = normalizeAndCache(data);

      if (onSuccess) {
        onSuccess(
          Object.values(entities[entity] as unknown as Record<string, TBasic>),
        );
      }

      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }

      return {
        limit: PAGE_SIZE,
        skip: allPages.length * PAGE_SIZE,
      };
    },
    ...(otherOptions || {}),
  });

  return {
    ...infiniteQuery,
    data: infiniteData
      ? {
          ...infiniteData,
          pages: (infiniteData?.pages || []).map((page) =>
            page.map((id) => getFromCache(id) as unknown as TBasic),
          ),
        }
      : undefined,
  };
};
