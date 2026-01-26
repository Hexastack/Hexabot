/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Grid, MenuItem } from "@mui/material";
import type { Path, PathValue } from "react-hook-form";

import type { FlowTypeInfo } from "@/components/visual-editor/v4/components/main/FlowsDrawer/types";
import { Format } from "@/services/types";
import type { IEntityMapTypes, THook } from "@/types/base.types";

import { BadgeWithTitle, type BadgeWithTitleProps } from "../displays/Badge";
import AutoCompleteEntitySelect, {
  type AutoCompleteEntitySelectProps,
} from "../inputs/AutoCompleteEntitySelect";
import { Input, type InputProps } from "../inputs/Input";

type filterDynamicFields<
  E extends keyof IEntityMapTypes,
  F extends Format,
  A extends { format?: Format } = { format?: F },
  C = THook<{
    entity: E;
    format: F;
  }>["current"],
> = {
  [Field in Path<C>]: {
    field: Field;
    value?: PathValue<C, Field>;
    idKey?: keyof C;
    sortKey?: keyof C;
    labelKey?: keyof C;
    onChange?: (value?: PathValue<C, Field>) => void;
  };
}[Path<C>] &
  A;

type EntityField = {
  [E in keyof IEntityMapTypes]: { entity: E } & (
    | filterDynamicFields<E, Format.BASIC>
    | filterDynamicFields<E, Format.BASIC, { format: Format.BASIC }>
    | filterDynamicFields<E, Format.FULL, { format: Format.FULL }>
  );
};

type EnumFilterType = Omit<InputProps, "onChange"> & {
  type: "enumFilter";
};

type EntityFilterType = Omit<
  AutoCompleteEntitySelectProps<any, string, false>,
  "ref" | "format" | "onChange" | "labelKey" | "searchFields" | "value"
> & {
  type: "entitySelectFilter";
  searchFields?: string[];
};

export type Filter = ({
  typeInfo?: Record<any, Omit<FlowTypeInfo, "labelKey">>;
  defaultOption?: BadgeWithTitleProps & { defaultValue?: string };
} & EntityField[keyof EntityField]) &
  (EnumFilterType | EntityFilterType);

export const GenericFilters = ({ filters }: { filters?: Filter[] }) =>
  filters?.map(
    ({
      value,
      field,
      idKey,
      format = Format.BASIC,
      entity,
      sortKey,
      labelKey,
      typeInfo,
      defaultOption = {},
      onChange,
      ...rest
    }) => {
      if (rest.type === "enumFilter") {
        const { defaultValue, ...defaultOptionRest } = defaultOption;

        return (
          <Grid key={field} flex={1} minWidth="180px">
            <Input
              select
              value={value || defaultValue}
              onChange={(e) => {
                onChange?.(e.target.value as never);
              }}
              {...rest}
            >
              {defaultValue ? (
                <MenuItem value={defaultValue}>
                  <BadgeWithTitle {...defaultOptionRest} />
                </MenuItem>
              ) : null}
              {typeInfo
                ? Object.entries(typeInfo).map(
                    ([type, { key, ...infoRest }]) => (
                      <MenuItem key={key} value={type}>
                        <BadgeWithTitle {...infoRest} title={type} />
                      </MenuItem>
                    ),
                  )
                : null}
            </Input>
          </Grid>
        );
      } else if (rest.type === "entitySelectFilter") {
        return (
          <Grid key={field} flex={1} minWidth="180px">
            <AutoCompleteEntitySelect<any, string, false>
              idKey={idKey?.toString()}
              sortKey={sortKey?.toString()}
              labelKey={labelKey?.toString() || ""}
              entity={entity}
              format={format}
              value={value}
              searchFields={rest.searchFields || []}
              size="medium"
              multiple={false}
              renderValue={(workflow) => (
                <Box p="2px 7px">
                  <BadgeWithTitle
                    {...typeInfo?.[workflow.type]}
                    title={workflow.name}
                  />
                </Box>
              )}
              renderOption={(props, workflow) => (
                <li {...props}>
                  <BadgeWithTitle
                    {...typeInfo?.[workflow.type]}
                    title={workflow.name}
                  />
                </li>
              )}
              onChange={(e, value) => {
                onChange?.(value?.[field]);
              }}
              {...rest}
            />
          </Grid>
        );
      }
    },
  );
