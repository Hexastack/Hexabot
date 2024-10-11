/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { InputAdornment, TextFieldProps } from "@mui/material";
import React, { ForwardedRef, forwardRef, useState } from "react";
import { Input } from "./Input";

export const RegexInput = forwardRef(
  (
    {
      onChange,
      value,
      error,
      helperText,
      ...props
    }: TextFieldProps & {
      value: string;
      onChange: (value: string) => void;
      error?: boolean;
      helperText?: string;
    },
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const [localError, setLocalError] = useState(false);
    const [localHelperText, setLocalHelperText] = useState("");

    const validateRegex = (regexString: string) => {
      try {
        new RegExp(regexString);
        return true;
      } catch (e) {
        setLocalError(true);
        setLocalHelperText("Regex is Invalid");
        return false;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const regexContent = inputValue;

      if (validateRegex(regexContent)) {
        setLocalError(false);
        setLocalHelperText("");
      } else {
        setLocalHelperText("Regex is Invalid");
      }

      onChange(`/${inputValue}/`);
    };

    return (
      <Input
        ref={ref}
        {...props}
        InputProps={{
          startAdornment: <InputAdornment position="start">/</InputAdornment>,
          endAdornment: <InputAdornment position="end">/gi</InputAdornment>,
        }}
        error={localError || error}
        helperText={localHelperText || helperText}
        value={value}
        onChange={handleChange}
      />
    );
  },
);

RegexInput.displayName = "RegexInput";
