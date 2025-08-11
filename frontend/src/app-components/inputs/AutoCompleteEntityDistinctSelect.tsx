/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, ChipTypeMap, ListSubheader } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete";
import { forwardRef } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { Format } from "@/services/types";
import { IEntityMapTypes, THook } from "@/types/base.types";

import AutoCompleteSelect from "./AutoCompleteSelect";

type AutoCompleteEntityDistinctSelectProps<
  TE extends THook["entity"],
  Value extends THook<{ entity: TE }>["full"] = THook<{ entity: TE }>["full"],
  Label extends keyof Value = keyof Value,
> = Omit<
  AutocompleteProps<Value, true, false, false, ChipTypeMap["defaultComponent"]>,
  "renderInput" | "options" | "value" | "defaultValue" | "multiple"
> & {
  value?: string[];
  label: string;
  idKey?: string;
  sortKey?: string;
  groupKey?: string | never;
  defaultGroupTitle: string;
  labelKey: Label;
  entity: keyof IEntityMapTypes;
  subEntity: keyof IEntityMapTypes;
  disableSearch?: boolean;
  error?: boolean;
  helperText?: string | null | undefined;
  preprocess?: (data: Value[]) => Value[];
  noOptionsWarning?: string;
};

const AutoCompleteEntityDistinctSelect = <
  TE extends THook["entity"],
  Value extends THook<{ entity: TE }>["full"] = THook<{ entity: TE }>["full"],
  Label extends keyof Value = keyof Value,
>(
  {
    entity,
    subEntity,
    groupKey,
    defaultGroupTitle,
    preprocess,
    idKey = "id",
    sortKey = "id",
    labelKey,
    ...rest
  }: AutoCompleteEntityDistinctSelectProps<TE, Value, Label>,
  ref,
) => {
  const getEntityFromCache = useGetFromCache(entity);
  const getSubEntityFromCache = useGetFromCache(subEntity);
  const { data = [], isFetching } = useFind(
    { entity, format: Format.FULL },
    {
      hasCount: false,
      initialSortState: sortKey ? [{ field: sortKey, sort: "asc" }] : [],
    },
  );
  const options = preprocess ? preprocess(data as Value[]) : (data as Value[]);

  return (
    <AutoCompleteSelect<Value, Label, true>
      ref={ref}
      idKey={idKey}
      labelKey={labelKey}
      options={options}
      loading={isFetching}
      getOptionDisabled={(option) => {
        const selectedOptions = rest.value;
        const selectedGroup = option[sortKey];
        const isOptionSelected = selectedOptions?.includes(option[idKey]);

        if (Array.isArray(selectedOptions)) {
          const selectedGroups = [
            ...new Set(
              selectedOptions?.map(
                (option) => getEntityFromCache(option)?.[sortKey] || "",
              ),
            ),
          ];
          const isOptionGroupSelected = selectedGroups.includes(selectedGroup);

          return !isOptionSelected && isOptionGroupSelected;
        }

        return false;
      }}
      groupBy={(option) => {
        if (option[sortKey] && groupKey) {
          const sortEntityId = option[sortKey];
          const groupTitle = getSubEntityFromCache(sortEntityId)?.[groupKey];

          return groupTitle || defaultGroupTitle;
        }

        return defaultGroupTitle;
      }}
      renderGroup={({ key, group, children }) => (
        <Box key={key}>
          <ListSubheader
            sx={{
              top: "-8px",
              border: "0.5px solid #eee",
              bgcolor: "#fafafaee",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
            color="primary"
          >
            {group}
          </ListSubheader>
          {children}
        </Box>
      )}
      multiple
      {...rest}
    />
  );
};

AutoCompleteEntityDistinctSelect.displayName =
  "AutoCompleteEntityDistinctSelect";

export default forwardRef(AutoCompleteEntityDistinctSelect) as <
  TE extends THook["entity"],
  Value extends THook<{ entity: TE }>["full"],
  TSortKey extends keyof Value,
  TGroupKey extends Value[TSortKey],
>(
  props: AutoCompleteEntityDistinctSelectProps<TE> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
    entity: TE;
    sortKey?: TSortKey;
    groupKey?: TGroupKey extends object ? keyof TGroupKey : never;
  },
) => ReturnType<typeof AutoCompleteEntityDistinctSelect>;
