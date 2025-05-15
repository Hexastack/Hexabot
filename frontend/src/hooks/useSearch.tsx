/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { debounce } from "@mui/material";
import { ChangeEvent, useState } from "react";

import {
  TBuildInitialParamProps,
  TBuildParamProps,
  TParamItem,
} from "@/types/search.types";

import { useQueryParam } from "./useQueryParam";
import { useUrlQuery } from "./useUrlQuery";

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
  const { getQueryParam } = useUrlQuery();
  const [searchText, setSearchText] = useState<string>(
    !!getQueryParam("search") ? String(getQueryParam("search")) : "",
  );
  const [isActive, setIsActive] = useState(false);
  const {
    $eq: eqInitialParams,
    $neq: neqInitialParams,
    $or: orParams,
    $iLike: iLikeParams,
  } = params;
  const onSearch = debounce(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      setSearchText(typeof e === "string" ? e : e.target.value);
    },
    300,
  );

  useQueryParam("search", searchText, "", setSearchText);

  return {
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
    textFieldProps: {
      value: isActive ? undefined : searchText,
      onChange: onSearch,
      onMouseOver: () => {
        setIsActive(true);
      },
      onMouseLeave: () => {
        setIsActive(false);
      },
    },
  };
};
