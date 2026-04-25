/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { ChipTypeMap } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete";
import type { ReactNode } from "react";
import { forwardRef, useEffect, useMemo, useRef } from "react";

import { useInfiniteFind } from "@/hooks/crud/useInfiniteFind";
import { useSearch } from "@/hooks/useSearch";
import type { RouteParams } from "@/services/api.class";
import { Format, QueryType } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";
import { TFilterStringFields } from "@/types/search.types";
import { generateId } from "@/utils/generateId";

import { WithEntityButton } from "../buttons/entities/WithEntityButton";
import { BASE_ADD_DIALOG_MAP } from "../dialogs/dialog.constants";

import { buildAutoCompleteEntityWhere } from "./auto-complete-entity-select.utils";
import AutoCompleteSelect from "./AutoCompleteSelect";

const PAGE_SIZE = 20;

export type AutoCompleteEntitySelectProps<
  Value,
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
  sortKey?: string;
  labelKey: Label;
  entity: keyof IEntityMapTypes;
  format: Format;
  searchFields: string[];
  inputLabelSx?: unknown;
  disableSearch?: boolean;
  error?: boolean;
  helperText?: string | null | undefined;
  preprocess?: (data: Value[]) => Value[];
  noOptionsWarning?: string;
  isDisabledWhenEmpty?: boolean;
  enableEntityAddButton?: boolean;
  routeParams?: RouteParams;
  queryEnabled?: boolean;
  where?: Record<string, unknown>;
};

const AutoCompleteEntitySelect = <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  {
    entity,
    format,
    searchFields,
    disableSearch,
    preprocess,
    idKey = "id",
    sortKey = "id",
    labelKey,
    enableEntityAddButton,
    routeParams,
    queryEnabled = true,
    where,
    ...rest
  }: AutoCompleteEntitySelectProps<Value, Label, Multiple>,
  ref,
) => {
  const { onSearch, searchPayload } = useSearch<typeof entity>(
    disableSearch
      ? {}
      : {
          $or: (searchFields as TFilterStringFields<unknown>) || [
            idKey,
            labelKey,
          ],
        },
  );
  const idRef = useRef(generateId());
  const serializedRouteParams = useMemo(
    () => JSON.stringify(routeParams || {}),
    [routeParams],
  );
  const serializedSearchPayload = useMemo(
    () => JSON.stringify(searchPayload),
    [searchPayload],
  );
  const serializedWhere = useMemo(() => JSON.stringify(where || {}), [where]);
  const params = {
    where: buildAutoCompleteEntityWhere({
      where,
      searchOrClauses: searchPayload.where?.or,
    }),
  };
  const { data, isFetching, fetchNextPage } = useInfiniteFind(
    { entity, format },
    {
      params: params as any,
      hasCount: false,
    },
    {
      initialPageParam: {
        limit: PAGE_SIZE,
        skip: 0,
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
      placeholderData: (prev) => prev,
      enabled: queryEnabled,
      routeParams,
      queryKey: [
        QueryType.collection,
        entity,
        `autocomplete/${idRef.current}/${serializedRouteParams}`,
      ],
    },
  );
  // flatten & filter unique & sort
  const flattenedData = data?.pages
    ?.flat()
    .filter(
      (a, idx, self) =>
        self.findIndex((b) => a?.[idKey] === b?.[idKey]) === idx,
    )
    .sort((a, b) => -b[sortKey]?.localeCompare(a[sortKey]));
  const options =
    preprocess && flattenedData
      ? preprocess((flattenedData || []) as unknown as Value[])
      : ((flattenedData || []) as Value[]);

  useEffect(() => {
    if (!queryEnabled) {
      return;
    }

    fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queryEnabled,
    serializedRouteParams,
    serializedSearchPayload,
    serializedWhere,
  ]);

  return (
    <WithEntityButton
      entity={entity as keyof typeof BASE_ADD_DIALOG_MAP}
      permissionAction={Action.CREATE}
      enableEntityAddButton={enableEntityAddButton}
    >
      <AutoCompleteSelect<Value, Label, Multiple>
        ref={ref}
        idKey={idKey}
        labelKey={labelKey}
        options={options || []}
        onSearch={onSearch}
        loading={isFetching}
        data-multiple={rest.multiple}
        {...rest}
      />
    </WithEntityButton>
  );
};

AutoCompleteEntitySelect.displayName = "AutoCompleteEntitySelect";

export default forwardRef(AutoCompleteEntitySelect) as unknown as <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  props: AutoCompleteEntitySelectProps<Value, Label, Multiple> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => ReturnType<typeof AutoCompleteEntitySelect>;
