/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { IconButton, InputAdornment, TextFieldProps } from "@mui/material";
import React, { forwardRef, useState } from "react";

import { Input } from "./Input";

export const PasswordInput = forwardRef<any, TextFieldProps>(
  ({ onChange, InputProps, value, ...rest }, ref) => {
    const [password, setPassword] = useState<string>(value as string);
    const [showPassword, setShowPassword] = useState(false);
    const handleTogglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        {...rest}
        defaultValue={value}
        onChange={handleChange}
        InputProps={{
          ...InputProps,
          endAdornment: password && (
            <InputAdornment position="end">
              <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                {showPassword ? (
                  <VisibilityOffOutlinedIcon />
                ) : (
                  <VisibilityOutlinedIcon />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";
