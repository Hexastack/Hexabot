/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Grid, Stack, Typography } from "@mui/material";
import type { ComponentProps, ReactNode } from "react";

type SummaryItemProps = {
  label: string;
  value: ReactNode;
  size?: ComponentProps<typeof Grid>["size"];
};

export const SummaryItem = ({
  label,
  value,
  size = { xs: 12, sm: 6 },
}: SummaryItemProps) => (
  <Grid size={size}>
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  </Grid>
);
