/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Stack, Typography, useTheme } from "@mui/material";

import { useAppRouter } from "@/hooks/useAppRouter";

import { mockQuickActions } from "../mockData";

export const QuickActions = () => {
  const router = useAppRouter();
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        Quick Actions
      </Typography>
      <Stack direction="row" gap={2} flexWrap="wrap">
        {mockQuickActions.map(({ icon: Icon, id, url, label }) => (
          <Button
            key={id}
            variant="outlined"
            startIcon={<Icon size={18} color={theme.palette.primary.main} />}
            onClick={() => url && router.push(url)}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};
