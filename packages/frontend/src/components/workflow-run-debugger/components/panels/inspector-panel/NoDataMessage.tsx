/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography } from "@mui/material";

type NoDataMessageProps = {
  label: string;
};

export const NoDataMessage = ({ label }: NoDataMessageProps) => (
  <Typography variant="body2" color="text.secondary">
    {label}
  </Typography>
);
