/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { InputAdornment, TextField, TextFieldProps } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

export const RegexInput = forwardRef(
  (
    {
      flags = ["g", "i"],
      ...props
    }: TextFieldProps & {
      flags?: string[];
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    return (
      <TextField
        ref={ref}
        {...props}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start">/</InputAdornment>,
            endAdornment: (
              <InputAdornment position="end">/{flags.join("")}</InputAdornment>
            ),
          },
        }}
      />
    );
  },
);

RegexInput.displayName = "RegexInput";
