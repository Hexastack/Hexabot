/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Button, Card, CardContent, Grid2 as Grid, IconButton, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Calendar, FileText, MousePointer2, Play } from "lucide-react";

import { mockPinnedWorkflows } from "../mockData";

const WorkflowCard = ({ workflow }: { workflow: any }) => {
  const theme = useTheme();
  const getTypeIcon = (type: string) => {
      if (type === 'Conversational') return <FileText size={20} />;
      if (type === 'Scheduled') return <Calendar size={20} />;
      
return <MousePointer2 size={20} />;
  }
  const isEnabled = workflow.status === 'Enabled';
  const statusColor = isEnabled ? theme.palette.success.main : theme.palette.text.disabled;

  return (
    <Card 
        elevation={0}
        sx={{ 
            height: '100%', 
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid transparent`,
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            overflow: 'visible',
            '&:hover': {
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)',
                '& .play-button': { opacity: 1, transform: 'scale(1)' }
            }
        }}
    >
        <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
             
             {/* Icon Box */}
             <Box sx={{ 
                minWidth: 48, 
                height: 48, 
                borderRadius: 3, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
             }}>
                 {getTypeIcon(workflow.type)}
             </Box>

             {/* Content */}
             <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {workflow.name}
                    </Typography>
                    <Box sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        bgcolor: statusColor,
                        boxShadow: isEnabled ? `0 0 8px ${statusColor}` : 'none'
                    }} />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                    {workflow.type} • {workflow.lastRun}
                </Typography>
             </Box>

             {/* Hover Action */}
             <IconButton 
                className="play-button"
                color="primary"
                sx={{ 
                    position: 'absolute',
                    right: 16,
                    opacity: 0,
                    transform: 'scale(0.8)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' }
                }}
            >
                <Play size={18} fill="currentColor" />
             </IconButton>

        </CardContent>
    </Card>
  );
};

export const PinnedWorkflows = () => {
    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                 <Typography variant="h6" fontWeight="bold">
                    Pinned
                 </Typography>
                 <Button size="small" variant="text" sx={{ borderRadius: 2 }}>
                    View All
                 </Button>
            </Box>
            <Grid container spacing={2}>
                {mockPinnedWorkflows.map((wf) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={wf.id}>
                        <WorkflowCard workflow={wf} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
