/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { debounce } from "@mui/material";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

import {
  TBuildInitialParamProps,
  TBuildParamProps,
  TParamItem,
} from "@/types/search.types";

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

export const useSearch = <T,>(params: TParamItem<T>) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>(
    (router.query.search as string) || "",
  );

  useEffect(() => {
    if (router.query.search !== searchText) {
      setSearchText((router.query.search as string) || "");
    }
  }, [router.query.search]);

  const updateQueryParams = useCallback(
    debounce(async (newSearchText: string) => {
      await router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, search: newSearchText || undefined },
        },
        undefined,
        { shallow: true },
      );
    }, 300),
    [router],
  );
  const onSearch = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
  ) => {
    const newSearchText = typeof e === "string" ? e : e.target.value;

    setSearchText(newSearchText);
    updateQueryParams(newSearchText);
  };
  const {
    $eq: eqInitialParams,
    $iLike: iLikeParams,
    $neq: neqInitialParams,
    $or: orParams,
  } = params;

  return {
    searchText,
    onSearch,
    searchPayload: {
      where: {
        ...buildEqInitialParams({ initialParams: eqInitialParams }),
        ...buildNeqInitialParams({ initialParams: neqInitialParams }),
        ...(searchText?.length > 0 && {
          ...buildOrParams({ params: orParams, searchText }),
          ...buildILikeParams({ params: iLikeParams, searchText }),
        }),
      },
    },
  };
};
