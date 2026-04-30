/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChipTypeMap } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete";
import get from "lodash/get";
import type { ReactNode } from "react";
import { forwardRef, useMemo, useState } from "react";

import { useApiClientQuery } from "@/hooks/useApiClient";
import { ApiClient } from "@/services/api.class";

import AutoCompleteSelect from "./AutoCompleteSelect";

export type ApiClientMethodName = {
  [K in keyof ApiClient]: ApiClient[K] extends (...args: any[]) => any
    ? K
    : never;
}[keyof ApiClient];

type ApiClientMethod<N extends ApiClientMethodName> = Extract<
  ApiClient[N],
  (...args: any[]) => any
>;

type AutoCompleteApiQuerySelectProps<
  N extends ApiClientMethodName,
  Value = ApiClientMethod<N> extends (...args: any[]) => Promise<(infer Item)[]>
    ? Item
    : never,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
> = Omit<
  AutocompleteProps<
    Value,
    Multiple,
    false,
    false,
    ChipTypeMap["defaultComponent"]
  >,
  "renderInput" | "options" | "value" | "defaultValue" | "label"
> & {
  value?: Multiple extends true ? string[] : string | null;
  label: ReactNode;
  idKey?: string;
  valueKey?: string;
  sortKey?: string;
  labelKey: Label;
  methodName: N;
  params?: Parameters<ApiClientMethod<N>>;
  inputLabelSx?: unknown;
  disableSearch?: boolean;
  error?: boolean;
  helperText?: string | null | undefined;
  preprocess?: (data: Awaited<ReturnType<ApiClientMethod<N>>>) => Value[];
  noOptionsWarning?: string;
  isDisabledWhenEmpty?: boolean;
  queryEnabled?: boolean;
  staleTime?: number;
};

const normalizeSearchValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).toLowerCase();
};
const resolveByPath = (target: unknown, path: string) => {
  if (!path) {
    return target;
  }

  return get(target as Record<string, unknown>, path);
};
const AutoCompleteApiQuerySelect = <
  N extends ApiClientMethodName,
  Value = ApiClientMethod<N> extends (...args: any[]) => Promise<(infer Item)[]>
    ? Item
    : never,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  {
    methodName,
    params,
    disableSearch,
    preprocess,
    idKey = "id",
    valueKey,
    sortKey = "id",
    labelKey,
    queryEnabled = true,
    staleTime,
    ...rest
  }: AutoCompleteApiQuerySelectProps<N, Value, Label, Multiple>,
  ref,
) => {
  const [searchText, setSearchText] = useState("");
  const { data, isFetching } = useApiClientQuery(methodName, {
    params: (params || []) as any,
    enabled: queryEnabled,
    staleTime,
  });
  const rawOptions = useMemo(() => {
    if (preprocess) {
      return preprocess(
        data as Awaited<ReturnType<ApiClientMethod<N>>>,
      ) as Value[];
    }

    return Array.isArray(data) ? (data as Value[]) : [];
  }, [data, preprocess]);
  const resolvedSavePath = valueKey?.trim() || idKey;
  const options = useMemo(() => {
    const filtered = disableSearch
      ? rawOptions
      : rawOptions.filter((option) => {
          if (!searchText) {
            return true;
          }

          return [
            resolveByPath(option, resolvedSavePath),
            option?.[labelKey],
          ].some((fieldValue) =>
            normalizeSearchValue(fieldValue).includes(
              searchText.trim().toLowerCase(),
            ),
          );
        });

    return filtered.sort((a, b) =>
      normalizeSearchValue(b?.[sortKey]).localeCompare(
        normalizeSearchValue(a?.[sortKey]),
      ),
    );
  }, [
    disableSearch,
    labelKey,
    rawOptions,
    resolvedSavePath,
    searchText,
    sortKey,
  ]);
  const valueWithSavePath = useMemo(() => {
    if (rest.multiple) {
      return Array.isArray(rest.value) ? rest.value : [];
    }

    return typeof rest.value === "string" ? rest.value : "";
  }, [rest.multiple, rest.value]);

  return (
    <AutoCompleteSelect<Value, Label, Multiple>
      ref={ref}
      idKey={idKey}
      labelKey={labelKey}
      options={options}
      value={valueWithSavePath as any}
      onSearch={setSearchText}
      loading={isFetching}
      data-multiple={rest.multiple}
      {...rest}
    />
  );
};

AutoCompleteApiQuerySelect.displayName = "AutoCompleteApiQuerySelect";

export default forwardRef(AutoCompleteApiQuerySelect) as unknown as <
  N extends ApiClientMethodName,
  Value = ApiClientMethod<N> extends (...args: any[]) => Promise<(infer Item)[]>
    ? Item
    : never,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  props: AutoCompleteApiQuerySelectProps<N, Value, Label, Multiple> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => ReturnType<typeof AutoCompleteApiQuerySelect>;
