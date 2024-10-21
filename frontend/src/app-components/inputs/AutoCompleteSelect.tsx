/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, Chip, ChipTypeMap, CircularProgress } from "@mui/material";
import Autocomplete, {
  AutocompleteProps,
  AutocompleteValue,
} from "@mui/material/Autocomplete";
import { useState, useCallback, useMemo, useEffect, forwardRef } from "react";

import { Input } from "@/app-components/inputs/Input";

import { AlertAdornment } from "./AlertAdornment";

type AutoCompleteSelectProps<
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
> = Omit<
  AutocompleteProps<
    Value,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipTypeMap["defaultComponent"]
  >,
  "renderInput" | "defaultValue" | "value"
> & {
  value?: Multiple extends true ? string[] : string | null;
  label: string;
  idKey?: string;
  labelKey: Label;
  onSearch?: (keywords: string) => void;
  error?: boolean;
  helperText?: string | null | undefined;
  noOptionsWarning?: string;
};

const AutoCompleteSelect = <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
>(
  {
    label,
    value,
    options = [],
    idKey = "id",
    labelKey,
    multiple,
    onSearch,
    error,
    helperText,
    isOptionEqualToValue = (option, value) => {
      return option[idKey] === value[idKey];
    },
    getOptionLabel = (option) => {
      return (option[labelKey as string] as string) || option[idKey];
    },
    freeSolo,
    limitTags,
    loading,
    noOptionsWarning,
    ...rest
  }: AutoCompleteSelectProps<
    Value,
    Label,
    Multiple,
    DisableClearable,
    FreeSolo
  >,
  ref,
) => {
  const handleSearch = useCallback(
    (keywords: string) => {
      if (onSearch) {
        onSearch(keywords);
      }
    },
    [onSearch],
  );
  const availableOptions = options;
  const [key, setKey] = useState(0);
  const selected = useMemo(() => {
    return freeSolo
      ? (value as AutocompleteValue<
          Value,
          Multiple,
          DisableClearable,
          FreeSolo
        >)
      : ((multiple
          ? options.filter((o) => value?.includes(o[idKey] as string))
          : options.find((o) => o[idKey] === value) ||
            (multiple ? [] : null)) as AutocompleteValue<
          Value,
          Multiple,
          DisableClearable,
          FreeSolo
        >);
  }, [freeSolo, value, multiple, options, idKey]);
  const isDisabled = useMemo(
    () => !freeSolo && options.length === 0,
    [freeSolo, options.length],
  );
  const [defaultValue, setDefaultValue] = useState(selected);

  useEffect(() => {
    if (
      key === 0 &&
      (Array.isArray(selected) ? selected.length > 0 : selected)
    ) {
      setKey(1);
      setDefaultValue(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <Autocomplete<Value, Multiple, DisableClearable, FreeSolo>
      {...rest}
      ref={ref}
      size="small"
      key={key}
      disabled={isDisabled}
      defaultValue={defaultValue}
      multiple={multiple}
      options={availableOptions || []}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      freeSolo={freeSolo}
      loading={loading}
      renderTags={(tags, getTagProps) => (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {(limitTags && tags.length > limitTags
            ? tags.slice(0, limitTags)
            : tags
          ).map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            const label = getOptionLabel
              ? getOptionLabel(option)
              : (option[labelKey] as string) || (option[idKey] as string);

            return (
              label && (
                <Chip variant="role" key={key} label={label} {...tagProps} />
              )
            );
          })}
          {limitTags && tags.length > limitTags && (
            <Chip
              variant="role"
              sx={{ marginTop: "2px" }}
              label={`+${tags.length - limitTags}`}
            />
          )}
        </Box>
      )}
      renderInput={(props) => (
        <Input
          {...props}
          label={label}
          onChange={(e) => handleSearch(e.target.value)}
          error={error}
          helperText={helperText}
          InputProps={{
            ...props.InputProps,
            endAdornment: (
              <>
                {options.length === 0 && !loading && noOptionsWarning && (
                  <AlertAdornment title={noOptionsWarning} type="warning" />
                )}
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {props.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

AutoCompleteSelect.displayName = "AutoCompleteSelect";

export default forwardRef(AutoCompleteSelect) as unknown as <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
>(
  props: AutoCompleteSelectProps<
    Value,
    Label,
    Multiple,
    DisableClearable,
    FreeSolo
  > & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => ReturnType<typeof AutoCompleteSelect>;
