/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { debounce } from "@mui/material";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import {
  TBuildInitialParamProps,
  TBuildParamProps,
  TFilterStringFields,
  TParamItem,
} from "@/types/search.types";

import { useQueryParam } from "./useQueryParam";

const buildOrParams = <T>({ params, searchText }: TBuildParamProps<T>) => ({
  or: params?.map((field) => ({
    [field]: { contains: searchText },
  })),
});
const buildILikeParams = <T>({ params, searchText }: TBuildParamProps<T>) =>
  params?.reduce((acc, field) => {
    acc[field] = { contains: searchText };

    return acc;
  }, {} as Record<TFilterStringFields<T>, unknown>);
const buildEqInitialParams = <T>({
  initialParams,
}: TBuildInitialParamProps<T>) =>
  initialParams?.reduce(
    (acc, obj) => ({
      ...acc,
      ...obj,
    }),
    {},
  );
const buildNeqInitialParams = <T>({
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

export const useSearch = <T>({
  $eq: eqInitialParams,
  $neq: neqInitialParams,
  $iLike: iLikeParams,
  $or: orParams,
  queryParam,
}: TParamItem<T>) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const queryParamKey = queryParam?.key || "";
  const { setQueryParam, getQueryParam } = useQueryParam();
  const queryParamValue = getQueryParam(queryParamKey);
  const [searchText, setSearchText] = useState<string>(
    queryParamValue?.toString() || "",
  );

  useEffect(() => {
    if (searchText && ref.current) {
      ref.current.value = searchText;
    }
  }, [searchText]);

  useEffect(() => {
    if (
      queryParamKey &&
      queryParamValue !== searchText &&
      queryParamValue !== undefined
    ) {
      setSearchText(queryParamValue.toString() || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParamValue, queryParamKey]);

  const onSearch = debounce(
    async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      const newSearchText = typeof e === "string" ? e : e.target.value;

      setSearchText(newSearchText);
      if (queryParamKey) {
        setQueryParam(queryParamKey, newSearchText, queryParam?.defaultValue);
      }
    },
    300,
  );

  return {
    ref,
    onSearch,
    searchText,
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
