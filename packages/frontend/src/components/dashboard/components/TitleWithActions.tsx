/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export const TitleWithActions = ({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
      px={1}
    >
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      {actions}
    </Box>
  );
};
