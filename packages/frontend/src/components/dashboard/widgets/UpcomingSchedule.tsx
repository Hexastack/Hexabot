/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { mockUpcomingSchedule } from "../mockData";

export const UpcomingSchedule = () => {
  const theme = useTheme();

  return (
    <Box sx={{ height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
         <Typography variant="h6" fontWeight="bold">
           Upcoming
         </Typography>
         <Button size="small" variant="text" sx={{ borderRadius: 2 }}>
            Calendar
         </Button>
      </Box>

      <Box sx={{ position: 'relative', px: 1 }}>
        {/* Timeline Line */}
        <Box sx={{ 
            position: 'absolute', 
            left: 23, 
            top: 16, 
            bottom: 30, 
            width: 2, 
            bgcolor: theme.palette.divider 
        }} />

        <Stack spacing={3}>
          {mockUpcomingSchedule.map((item, index) => (
            <Box key={item.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                {/* Timeline Dot Wrapper */}
                <Box sx={{ 
                    width: 32, 
                    display: 'flex', 
                    justifyContent: 'center',
                    flexShrink: 0  // Prevent shrinking
                }}>
                    <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: index === 0 ? theme.palette.primary.main : theme.palette.background.paper,
                        border: `2px solid ${index === 0 ? theme.palette.primary.main : theme.palette.divider}`,
                        zIndex: 1,
                        mt: 0.8,
                        // ml removed
                    }} />
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        {item.nextRun}
                    </Typography>
                    
                    <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            transform: 'translateX(4px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }
                    }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Workflow: {item.workflow}
                        </Typography>
                    </Box>
                </Box>
            </Box>
          ))}
           
           <Button 
                fullWidth 
                variant="outlined" 
                size="small" 
                sx={{ 
                    mt: 1, 
                    borderRadius: 3, 
                    borderColor: theme.palette.divider, 
                    color: theme.palette.text.secondary,
                    textTransform: 'none'
                }}
            >
                View Full Schedule
           </Button>
        </Stack>
      </Box>
    </Box>
  );
};
