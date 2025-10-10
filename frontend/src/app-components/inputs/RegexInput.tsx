/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { InputAdornment, TextFieldProps } from "@mui/material";
import { ForwardedRef, forwardRef } from "react";

import { Input } from "./Input";

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
      <Input
        ref={ref}
        {...props}
        InputProps={{
          startAdornment: <InputAdornment position="start">/</InputAdornment>,
          endAdornment: (
            <InputAdornment position="end">/{flags.join("")}</InputAdornment>
          ),
        }}
      />
    );
  },
);

RegexInput.displayName = "RegexInput";
