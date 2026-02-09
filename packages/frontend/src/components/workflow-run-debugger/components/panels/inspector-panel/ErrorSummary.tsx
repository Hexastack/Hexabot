/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography } from "@mui/material";

import { SummaryItem } from "./SummaryItem";

type ErrorSummaryProps = {
  label: string;
  errorSummary: string;
  hasError: boolean;
};

export const ErrorSummary = ({
  label,
  errorSummary,
  hasError,
}: ErrorSummaryProps) => (
  <SummaryItem
    label={label}
    value={
      <Typography
        variant="body2"
        sx={{
          color: hasError ? "error.main" : "text.secondary",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 20,
          overflow: "hidden",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {errorSummary}
      </Typography>
    }
  />
);
