/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { createReadOnlyInputProps } from "./readOnlyInput.util";

type PasswordInputProps = Omit<
  TextFieldProps,
  "FormHelperTextProps" | "InputLabelProps" | "InputProps" | "inputProps"
>;

export const PasswordInput = forwardRef<any, PasswordInputProps>(
  ({ slotProps, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const handleTogglePasswordVisibility = () => {
      setShowPassword((value) => !value);
    };
    const handleMouseDownPassword: React.MouseEventHandler<
      HTMLButtonElement
    > = (event) => {
      event.preventDefault();
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
            <InputAdornment
              position="end"
              sx={{ "& .MuiIconButton-root:last-child": { marginRight: 0 } }}
            >
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                edge="end"
                size="small"
                onClick={handleTogglePasswordVisibility}
                onMouseDown={handleMouseDownPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
            </InputAdornment>
          </>
        ),
      };
    };

    return (
      <TextField
        ref={ref}
        type={showPassword ? "text" : "password"}
        {...rest}
        slotProps={{
          ...slotProps,
          input: resolveInputSlotProps,
          htmlInput: rest.autoComplete
            ? undefined
            : createReadOnlyInputProps(slotProps?.htmlInput),
        }}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
