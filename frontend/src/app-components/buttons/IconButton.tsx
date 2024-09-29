/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
