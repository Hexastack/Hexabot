/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChangeEvent, useState } from "react";

import { THook } from "@/types/base.types";
import {
  EqParam,
  IlikeParam,
  NeqParam,
  SearchHookOptions,
  SearchPayload,
  TBuildInitialParamProps,
  TBuildParamProps,
  TParamItem,
} from "@/types/search.types";

import { useUrlQueryParam } from "./useUrlQueryParam";

const buildOrParams = <T,>({ params, searchText }: TBuildParamProps<T>) => ({
  or: params?.map((field) => ({
    [field]: { contains: searchText },
  })) as IlikeParam<T>[],
});
const buildILikeParams = <T,>({ params, searchText }: TBuildParamProps<T>) =>
  params?.reduce(
    (acc, field) => ({
      ...acc,
      [field]: { contains: searchText },
    }),
    {} as IlikeParam<T>,
  );
const buildEqInitialParams = <T,>({
  initialParams,
}: TBuildInitialParamProps<T>) =>
  initialParams?.reduce(
    (acc, obj) => ({
      ...acc,
      ...obj,
    }),
    {} as EqParam<T>,
  );
const buildNeqInitialParams = <T,>({
  initialParams,
}: TBuildInitialParamProps<T>) =>
  initialParams?.reduce(
    (acc, obj) => ({
      ...acc,
      [Object.entries(obj)[0][0]]: {
        "!=": Object.entries(obj)[0][1],
      },
    }),
    {} as NeqParam<T>,
  );

export const useSearch = <
  TE extends THook["entity"],
  TFilters extends THook<{ entity: TE }>["filters"] = THook<{
    entity: TE;
  }>["filters"],
>(
  params: TParamItem<TFilters>,
  { syncUrl }: SearchHookOptions = { syncUrl: false },
) => {
  const [searchQuery, setSearchQuery] = useUrlQueryParam("search", "");
  const [search, setSearch] = useState<string>("");
  const searchText = syncUrl ? searchQuery : search;

  return {
    searchText,
    onSearch: (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
    ) => {
      const newValue =
        typeof e === "object" ? e.target.value.toString() : e.toString();

      if (syncUrl) {
        setSearchQuery(newValue);
      } else {
        setSearch(newValue);
      }
    },
    searchPayload: {
      where: {
        ...buildEqInitialParams({ initialParams: params.$eq }),
        ...buildNeqInitialParams({ initialParams: params.$neq }),
        ...(searchText?.length > 0 && {
          ...buildOrParams({ params: params.$or, searchText }),
          ...buildILikeParams({ params: params.$iLike, searchText }),
        }),
      },
    } as SearchPayload<TFilters>,
  };
};
