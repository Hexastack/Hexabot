/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, Switch, TextFieldProps } from "@mui/material";
import { forwardRef, LegacyRef, useEffect, useState } from "react";

import { Input } from "./Input";

export const ToggleableInput = forwardRef(
  (
    {
      onChange,
      readOnlyValue,
      defaultValue,
      disabled,
      ...props
    }: Omit<TextFieldProps, "onChange"> & {
      onChange: (value: string) => void;
      readOnlyValue: string;
    },
    ref: LegacyRef<HTMLDivElement>,
  ) => {
    const [isDisabled, setIsDisabled] = useState(
      defaultValue === readOnlyValue,
    );
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
      // When readOnlyValue or isDisabled changes, adjust the value accordingly
      if (isDisabled) {
        setValue(readOnlyValue);
        onChange(readOnlyValue);
      } else {
        setValue(defaultValue);
      }
    }, [readOnlyValue, isDisabled, defaultValue]);

    return (
      <Box display="flex" flex={1}>
        <Switch
          onChange={() => {
            const newIsDisabled = !isDisabled;

            setIsDisabled(newIsDisabled);
            if (newIsDisabled) {
              onChange(readOnlyValue); // Call onChange when changing to readOnly state
            }
          }}
          checked={!isDisabled}
          disabled={disabled}
        />
        <Input
          ref={ref}
          {...props}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          value={value ?? ""}
          disabled={disabled || isDisabled}
        />
      </Box>
    );
  },
);

ToggleableInput.displayName = "ToggleableInput";
