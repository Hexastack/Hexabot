/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { InputAdornment, TextFieldProps } from "@mui/material";
import React, { ForwardedRef, forwardRef } from "react";

import { Input } from "./Input";

export const RegexInput = forwardRef(
  (
    {
      onChange,
      value,
      ...props
    }: TextFieldProps & { value: string; onChange: (value: string) => void },
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    return (
      <Input
        ref={ref}
        {...props}
        InputProps={{
          startAdornment: <InputAdornment position="start">/</InputAdornment>,
          endAdornment: <InputAdornment position="end">/gi</InputAdornment>,
        }}
        value={value}
        onChange={(e) => {
          onChange(`/${e.target.value}/`);
        }}
      />
    );
  },
);

RegexInput.displayName = "Input";
