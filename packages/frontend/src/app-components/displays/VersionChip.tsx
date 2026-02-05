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

export const VersionChip = ({ version, ...rest }: VersionChipProps) => {
  const resolvedLabel =
    typeof version?.version === "number"
      ? `Version ${version.version}`
      : undefined;

  if (!resolvedLabel) return null;

  return (
    <Chip size="small" variant="outlined" label={resolvedLabel} {...rest} />
  );
};
