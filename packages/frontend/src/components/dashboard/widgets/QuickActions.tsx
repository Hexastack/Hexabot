/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useAppRouter } from "@/hooks/useAppRouter";

import { mockQuickActions } from "../mockData";

export const QuickActions = () => {
  const theme = useTheme();
  const router = useAppRouter();

  return (
    <Box>
      <Typography variant="h6">Quick Actions</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {mockQuickActions.map(({ icon: Icon, ...rest }) => {
          return (
            <Button
              key={rest.id}
              color="primary"
              variant="outlined"
              startIcon={<Icon size={18} color={theme.palette.primary.main} />}
              onClick={() => {
                if (rest.url) {
                  router.push(rest.url);
                }
              }}
            >
              <Typography color="textPrimary">{rest.label}</Typography>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};
