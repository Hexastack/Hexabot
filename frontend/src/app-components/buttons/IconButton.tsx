/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  ButtonProps,
  CSSObject,
  IconButton as MuiIconButton,
  styled,
} from "@mui/material";

type IconButtonVariant = ButtonProps["variant"] | "outlined-reverse";

export const IconButton = styled(MuiIconButton)<{
  variant?: IconButtonVariant;
}>(({ theme, variant, color, disabled }) => {
  const overrides: CSSObject = {};

  overrides.borderRadius = theme.shape.borderRadius * 3;

  const colorAsVariant =
    color === undefined || color === "inherit" || color === "default"
      ? "primary"
      : color;

  if (variant === "contained") {
    if (disabled) {
      overrides["&:disabled"] = {
        backgroundColor: theme.palette.action.disabled,
      };
    }
    overrides[":hover"] = {
      backgroundColor: theme.palette[colorAsVariant].dark,
    };
    overrides.backgroundColor = theme.palette[colorAsVariant].main;
    overrides.color = theme.palette[colorAsVariant].contrastText;
  }
  if (variant === "outlined") {
    overrides.outline = `1px solid ${
      disabled
        ? theme.palette.action.disabled
        : theme.palette[colorAsVariant].main
    }`;
    overrides.outlineOffset = "-1px";
    overrides.color = theme.palette[colorAsVariant].main;
  }
  if (variant === "outlined-reverse") {
    overrides.backgroundColor = theme.palette[colorAsVariant].main;
    overrides.outline = `1px solid ${theme.palette[colorAsVariant].contrastText}`;
    overrides.outlineOffset = "-1px";
    overrides.color = theme.palette[colorAsVariant].contrastText;
  }

  if (variant === "text") {
    overrides.color = theme.palette.action.active;
    overrides.backgroundColor = "transparent";
    overrides.outline = "transparent";
    overrides.borderColor = "transparent";

    overrides[":hover "] = {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.error.main,
    };
  }

  return {
    ...overrides,
  };
});
