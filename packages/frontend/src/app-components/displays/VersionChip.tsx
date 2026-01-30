/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Chip, type ChipProps } from "@mui/material";

import type { IWorkflowVersion } from "@/types/workfow-version.types";

export type VersionChipProps = Omit<
  ChipProps,
  "label" | "size" | "variant" | "color"
> & {
  version: IWorkflowVersion | null;
};

const versionChipStyles = {
  height: 18,
  fontSize: 10,
  fontWeight: 600,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.default",
  color: "text.secondary",
} as const;

export const VersionChip = ({ version, sx, ...rest }: VersionChipProps) => {
  const resolvedLabel =
    typeof version?.version === "number"
      ? `Version ${version.version}`
      : undefined;

  if (!resolvedLabel) return null;

  return (
    <Chip
      size="small"
      variant="outlined"
      label={resolvedLabel}
      sx={[versionChipStyles, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    />
  );
};
