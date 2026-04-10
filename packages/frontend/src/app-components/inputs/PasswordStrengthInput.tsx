/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, LinearProgress, TextFieldProps, Typography } from "@mui/material";
import { forwardRef, useMemo, useState } from "react";

import { useTranslate } from "@/hooks/useTranslate";

import { PasswordInput } from "./PasswordInput";

type PasswordStrengthInputProps = Omit<
  TextFieldProps,
  "FormHelperTextProps" | "InputLabelProps" | "InputProps" | "inputProps"
>;

type PasswordStrengthLabelKey =
  | "message.password_strength_weak"
  | "message.password_strength_fair"
  | "message.password_strength_good"
  | "message.password_strength_strong";

type PasswordStrength = {
  color: string;
  labelKey: PasswordStrengthLabelKey | null;
  score: number;
};

const getPasswordStrength = (value: string): PasswordStrength => {
  const hasMinimumLength = value.length >= 8;
  const hasLowerCase = /[a-z]/.test(value);
  const hasUpperCase = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(value);

  if (!value) {
    return {
      color: "grey.400",
      labelKey: null,
      score: 0,
    };
  }

  let score = 0;

  if (hasMinimumLength) {
    score += 1;
  }
  if (hasLowerCase && hasUpperCase) {
    score += 1;
  }
  if (hasDigit) {
    score += 1;
  }
  if (hasSpecialChar) {
    score += 1;
  }

  if (score <= 1) {
    return {
      color: "error.main",
      labelKey: "message.password_strength_weak",
      score: 1,
    };
  }
  if (score === 2) {
    return {
      color: "warning.main",
      labelKey: "message.password_strength_fair",
      score: 2,
    };
  }
  if (score === 3) {
    return {
      color: "info.main",
      labelKey: "message.password_strength_good",
      score: 3,
    };
  }

  return {
    color: "success.main",
    labelKey: "message.password_strength_strong",
    score: 4,
  };
};

export const PasswordStrengthInput = forwardRef<any, PasswordStrengthInputProps>(
  ({ onChange, value, ...rest }, ref) => {
    const { t } = useTranslate();
    const [passwordValue, setPasswordValue] = useState("");
    const resolvedValue = typeof value === "string" ? value : passwordValue;
    const strength = useMemo(
      () => getPasswordStrength(resolvedValue),
      [resolvedValue],
    );
    const handleChange: TextFieldProps["onChange"] = (event) => {
      setPasswordValue(event.target.value);
      onChange?.(event);
    };
    const strengthLabel = strength.labelKey ? t(strength.labelKey) : "";

    return (
      <Box>
        <PasswordInput
          ref={ref}
          {...rest}
          value={value}
          onChange={handleChange}
        />
        {resolvedValue ? (
          <Box sx={{ mt: 0.75 }}>
            <LinearProgress
              variant="determinate"
              value={(strength.score / 4) * 100}
              sx={{
                borderRadius: 999,
                height: 6,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  bgcolor: strength.color,
                },
              }}
            />
            <Typography
              sx={{ color: "text.secondary", fontSize: "0.75rem", mt: 0.5 }}
            >
              {`${t("message.password_strength")}: ${strengthLabel}`}
            </Typography>
          </Box>
        ) : null}
      </Box>
    );
  },
);

PasswordStrengthInput.displayName = "PasswordStrengthInput";
