/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TextField, TextFieldProps } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

type InputProps = Omit<
  TextFieldProps,
  "FormHelperTextProps" | "InputLabelProps" | "InputProps" | "inputProps"
>;

export const Input = forwardRef(
  (props: InputProps, ref: ForwardedRef<HTMLDivElement>) => {
    const { slotProps, required, ...rest } = props;

    return (
      <TextField
        ref={ref}
        type="text"
        size="small"
        fullWidth
        required={required}
        slotProps={{
          ...slotProps,
          htmlInput: {
            ...(required && { required: false }),
            ...slotProps?.htmlInput,
          },
        }}
        {...rest}
      />
    );
  },
);

Input.displayName = "Input";
