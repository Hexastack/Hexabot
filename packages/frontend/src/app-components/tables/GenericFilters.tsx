/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Box,
  Grid,
  type InputProps,
  MenuItem,
  type TextFieldProps,
  type UseAutocompleteProps,
} from "@mui/material";
import type { Path } from "react-hook-form";

import type { FlowTypeInfo } from "@/components/visual-editor/v4/components/main/FlowsDrawer/types";
import type { IEntityMapTypes, THook } from "@/types/base.types";

import { BadgeWithTitle, type BadgeWithTitleProps } from "../displays/Badge";
import AutoCompleteEntitySelect, {
  type AutoCompleteEntitySelectProps,
} from "../inputs/AutoCompleteEntitySelect";
import { Input } from "../inputs/Input";

export type GenericFiltersProps<
  TP extends THook["params"],
  TE extends TP["entity"],
  F extends TP["format"],
> =
  | ({
      type: "enumFilter";
      field: Path<THook<{ entity: TE; format: F }>["current"]>;
      value?: string;
      label?: string;
      onChange?: InputProps["onChange"];
      typeInfo: Record<any, Omit<FlowTypeInfo, "labelKey">>;
      defaultOption?: BadgeWithTitleProps & { defaultValue: string };
    } & TextFieldProps)
  | ({
      type: "entitySelect";
      field: Path<THook<{ entity: TE; format: F }>["current"]>;
      value?: string;
      label?: string;
      onChange?: UseAutocompleteProps<any, false, false, false>["onChange"];
      typeInfo: Record<any, Omit<FlowTypeInfo, "labelKey">>;
      defaultOption?: BadgeWithTitleProps & { defaultValue: string };
      entity: keyof IEntityMapTypes;
    } & Omit<
      AutoCompleteEntitySelectProps<any, string, false>,
      "ref" | "onChange"
    >);

export const GenericFilters = <
  TP extends THook["params"],
  TE extends TP["entity"],
  F extends TP["format"],
>({
  filters,
}: {
  filters?: GenericFiltersProps<TP, TE, F>[];
}) => {
  return filters?.map(
    ({ type, value, field, typeInfo, defaultOption, ...rest }) => {
      if (!("entity" in rest) && type === "enumFilter") {
        return (
          <Grid key={field} flex={1} minWidth="180px">
            <Input
              select
              value={value || defaultOption?.defaultValue}
              {...rest}
            >
              {defaultOption?.defaultValue ? (
                <MenuItem value={defaultOption.defaultValue}>
                  <BadgeWithTitle {...defaultOption} />
                </MenuItem>
              ) : null}
              {Object.entries(typeInfo).map(([type, info]) => (
                <MenuItem key={type} value={type}>
                  <BadgeWithTitle {...info} title={type} />
                </MenuItem>
              ))}
            </Input>
          </Grid>
        );
      } else if ("entity" in rest && type === "entitySelect") {
        return (
          <Grid key={field} flex={1} minWidth="180px">
            <AutoCompleteEntitySelect<any, string, false>
              value={value}
              size="medium"
              multiple={false}
              renderValue={(workflow) => (
                <Box p="2px 7px">
                  <BadgeWithTitle
                    {...typeInfo[workflow.type]}
                    title={workflow.name}
                  />
                </Box>
              )}
              renderOption={(props, workflow) => (
                <li {...props}>
                  <BadgeWithTitle
                    {...typeInfo[workflow.type]}
                    title={workflow.name}
                  />
                </li>
              )}
              {...rest}
            />
          </Grid>
        );
      }
    },
  );
};
