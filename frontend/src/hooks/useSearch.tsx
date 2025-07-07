/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChangeEvent, useState } from "react";

import {
  TBuildInitialParamProps,
  TBuildParamProps,
  TParamItem,
} from "@/types/search.types";

import { useUrlQueryParam } from "./useUrlQueryParam";

const buildOrParams = <T,>({ params, searchText }: TBuildParamProps<T>) => ({
  or: params?.map((field) => ({
    [field]: { contains: searchText },
  })),
});
const buildILikeParams = <T,>({ params, searchText }: TBuildParamProps<T>) =>
  params?.reduce(
    (acc, field) => ({
      ...acc,
      [field]: { contains: searchText },
    }),
    {},
  );
const buildEqInitialParams = <T,>({
  initialParams,
}: TBuildInitialParamProps<T>) =>
  initialParams?.reduce(
    (acc, obj) => ({
      ...acc,
      ...obj,
    }),
    {},
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
    {},
  );
const buildFullTextSearch = (searchText: string) => ({
  $text: { $search: searchText },
});

interface SearchHookOptions {
  syncUrl?: boolean;
}

export const useSearch = <T,>(
  params: TParamItem<T>,
  options: SearchHookOptions = { syncUrl: false },
) => {
  const { syncUrl } = options;
  const [searchQuery, setSearchQuery] = useUrlQueryParam("search", "");
  const [search, setSearch] = useState<string>("");
  const {
    $eq: eqInitialParams,
    $iLike: iLikeParams,
    $neq: neqInitialParams,
    $or: orParams,
  } = params;
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
        ...buildEqInitialParams({ initialParams: eqInitialParams }),
        ...buildNeqInitialParams({ initialParams: neqInitialParams }),
      ...(searchText?.length > 0 && {
      ...(params.$text ? buildFullTextSearch(searchText) : {}),
      ...buildOrParams({ params: orParams, searchText }),
      ...buildILikeParams({ params: iLikeParams, searchText }),
        }),
      },
    },
  };
};
