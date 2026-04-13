/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { InputAdornment, Tooltip, useTheme } from "@mui/material";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type AlertType = "warning" | "error" | "info" | "success";

type ColorType =
  | "disabled"
  | "action"
  | "inherit"
  | "error"
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning";

const getIcon = (type: AlertType, color: string) => {
  switch (type) {
    case "error":
      return <AlertCircle color={color} size={18} />;
    case "info":
      return <Info color={color} size={18} />;
    case "success":
      return <CheckCircle2 color={color} size={18} />;
    case "warning":
    default:
      return <AlertTriangle color={color} size={18} />;
  }
};

export const AlertAdornment = ({
  title,
  type = "warning",
  color,
}: {
  title: string;
  type?: AlertType;
  color?: ColorType;
}) => {
  const theme = useTheme();
  const resolvedColor = (() => {
    const value = color ?? type;

    switch (value) {
      case "inherit":
        return "currentColor";
      case "action":
        return theme.palette.action.active;
      case "disabled":
        return theme.palette.action.disabled;
      case "primary":
        return theme.palette.primary.main;
      case "secondary":
        return theme.palette.secondary.main;
      case "error":
        return theme.palette.error.main;
      case "info":
        return theme.palette.info.main;
      case "success":
        return theme.palette.success.main;
      case "warning":
      default:
        return theme.palette.warning.main;
    }
  })();

  return (
    <Tooltip
      arrow
      title={title}
      PopperProps={{
        sx: {
          "& .MuiTooltip-tooltip": {
            fontSize: "13px",
            padding: 0.6,
            maxWidth: "none",
          },
        },
      }}
    >
      <InputAdornment position="end">
        {getIcon(type, resolvedColor)}
      </InputAdornment>
    </Tooltip>
  );
};
