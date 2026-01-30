/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButton, InputAdornment, TextFieldProps } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { Input } from "./Input";

type PasswordInputProps = Omit<
  TextFieldProps,
  "FormHelperTextProps" | "InputLabelProps" | "InputProps" | "inputProps"
>;

export const PasswordInput = forwardRef<any, PasswordInputProps>(
  ({ slotProps, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const handleTogglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
    const resolveInputSlotProps = (ownerState: any) => {
      const resolved = (
        typeof slotProps?.input === "function"
          ? slotProps.input(ownerState)
          : slotProps?.input
      ) as { endAdornment?: React.ReactNode } | undefined;

      return {
        ...(resolved ?? {}),
        endAdornment: (
          <>
            {resolved?.endAdornment}
            <InputAdornment position="end">
              <IconButton onClick={handleTogglePasswordVisibility}>
                {showPassword ? <EyeOff /> : <Eye />}
              </IconButton>
            </InputAdornment>
          </>
        ),
      };
    };

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        {...rest}
        slotProps={{
          ...slotProps,
          input: resolveInputSlotProps,
        }}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
