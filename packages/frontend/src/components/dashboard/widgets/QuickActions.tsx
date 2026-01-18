/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { mockQuickActions } from "../mockData";

export const QuickActions = () => {
  const theme = useTheme();

  return (
    <Box>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, ml: 1, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary', letterSpacing: '0.5px' }}>
            Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {mockQuickActions.map((action) => {
            const Icon = action.icon;
            
return (
              <Paper
                key={action.id}
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 1.25,
                  px: 2,
                  cursor: "pointer",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  bgcolor: theme.palette.background.paper,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                     borderColor: theme.palette.primary.main,
                     bgcolor: alpha(theme.palette.primary.main, 0.04),
                     transform: 'translateY(-2px)',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }
                }}
                onClick={() => {
                  // TODO: Implement action
                }}
              >
                <Box sx={{ 
                    color: theme.palette.primary.main,
                    display: 'flex'
                }}>
                    <Icon size={18} />
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {action.label}
                </Typography>
              </Paper>
            );
          })}
        </Box>
    </Box>
  );
};
