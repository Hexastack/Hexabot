/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AlertTriangle, Filter, RefreshCcw, Settings, User } from "lucide-react";

import { mockRecentActivity } from "../mockData";

export const RecentActivity = () => {
  const theme = useTheme();
  // Helper because Play is already defined in lucide-react but I want to use it
  const PlayIcon = ({size}: {size:number}) => (
       <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
  );
  const getIcon = (text: string) => {
      if (text.includes("edited")) return <User size={14} />;
      if (text.includes("Manual run")) return <PlayIcon size={14} />; 
      if (text.includes("System")) return <Settings size={14} />;
      if (text.includes("missed")) return <AlertTriangle size={14} />;
      
return <RefreshCcw size={14} />;
  }

  return (
    <Box sx={{ height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
         <Typography variant="h6" fontWeight="bold">
           Activity
         </Typography>
         <Button size="small" variant="text" startIcon={<Filter size={14} />} sx={{ borderRadius: 2 }}>
            Filter
         </Button>
      </Box>

      <Box sx={{ position: 'relative', px: 1 }}>
        {/* Timeline Line */}
        <Box sx={{ 
            position: 'absolute', 
            left: 23, 
            top: 16, 
            bottom: 10, 
            width: 2, 
            bgcolor: theme.palette.divider 
        }} />

        <Stack spacing={3}>
          {mockRecentActivity.map((event, index) => (
            <Box key={event.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                {/* Timeline Dot Wrapper */}
                 <Box sx={{ 
                    width: 32, 
                    display: 'flex', 
                    justifyContent: 'center',
                    flexShrink: 0 // Prevent shrinking
                }}>
                    <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: theme.palette.background.paper,
                        border: `2px solid ${index === 0 ? theme.palette.primary.main : theme.palette.divider}`,
                        zIndex: 1,
                        mt: 0.5,
                        // ml removed
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {index === 0 && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.primary.main }} />}
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                         <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            {event.time}
                        </Typography>
                    </Box>
                   
                    <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.background.paper, 0.8)
                        }
                    }}>
                        <Avatar sx={{ 
                            width: 28, 
                            height: 28, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1), 
                            color: theme.palette.primary.main,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}>
                             {getIcon(event.text)}
                        </Avatar>
                        <Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.4, fontSize: '0.85rem' }}>
                                <Box component="span" fontWeight="bold" color="text.primary">{event.user}</Box> {event.text.replace(event.user, '').trim()}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};
