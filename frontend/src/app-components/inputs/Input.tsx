/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { TextField, TextFieldProps } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

export const Input = forwardRef(
  (props: TextFieldProps, ref: ForwardedRef<HTMLDivElement>) => (
    <TextField
      ref={ref}
      type="text"
      size="small"
      fullWidth
      inputProps={{
        ...(props.required && { required: false }),
        ...props.inputProps,
      }}
      {...props}
    />
  ),
);

Input.displayName = "Input";
