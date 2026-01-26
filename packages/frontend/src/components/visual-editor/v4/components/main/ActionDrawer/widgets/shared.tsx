/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Tooltip } from "@mui/material";
import type { RJSFSchema } from "@rjsf/utils";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

type LabelWithTooltipProps = {
  label?: ReactNode;
  description?: ReactNode;
  iconSize?: number;
};

export const labelTooltipSx = {
  display: "inline-flex",
  alignItems: "center",
  "& .MuiFormLabel-asterisk": {
    order: 2,
  },
  "& .action-field-label-icon": {
    order: 3,
  },
} as const;

export const labelTooltipInputLabelSx = {
  ...labelTooltipSx,
  pointerEvents: "auto",
} as const;

export const getDescription = (
  schema: RJSFSchema | undefined,
  options?: { description?: ReactNode },
) => {
  const description = options?.description ?? schema?.description;

  if (typeof description === "string") {
    const trimmed = description.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  return description || undefined;
};

export const LabelWithTooltip = ({
  label,
  description,
  iconSize = 14,
}: LabelWithTooltipProps) => {
  if (!label || !description) {
    return label ?? null;
  }

  return (
    <>
      {label}
      <Tooltip title={description} placement="top" arrow>
        <Box
          component="span"
          className="action-field-label-icon"
          sx={{
            display: "inline-flex",
            color: "text.secondary",
            marginLeft: "4px",
          }}
        >
          <Info size={iconSize} aria-hidden />
        </Box>
      </Tooltip>
    </>
  );
};

export const mergeLabelSx = (baseSx: any, sx?: any) => {
  if (!sx) {
    return baseSx;
  }

  return Array.isArray(sx) ? [baseSx, ...sx] : [baseSx, sx];
};
