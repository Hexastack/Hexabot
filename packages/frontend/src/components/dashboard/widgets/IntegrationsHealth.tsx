/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Card, CardContent, CardHeader, Chip, Grid2 as Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link2, Mail, MessageCircle } from "lucide-react";

import { mockIntegrations } from "../mockData";

const IntegrationCard = ({ integration }: { integration: any }) => {
    const theme = useTheme();
    const isConn = integration.status === 'Connected';
    // Mock logo or icon based on name
    const getIcon = () => {
        if(integration.name.includes("WhatsApp")) return <MessageCircle size={20} />;
        if(integration.name.includes("Email")) return <Mail size={20} />;
        
return <Link2 size={20} />;
    }

    return (
        <Card variant="outlined" sx={{ 
            p: 2, 
            borderRadius: 3, 
            border: `1px solid ${isConn ? theme.palette.divider : alpha(theme.palette.warning.main, 0.5)}`,
            bgcolor: isConn ? 'transparent' : alpha(theme.palette.warning.main, 0.02)
        }}>
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                         <Box sx={{ 
                            p: 1, 
                            borderRadius: '50%', 
                            bgcolor: isConn ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                            color: isConn ? theme.palette.success.main : theme.palette.warning.main
                        }}>
                             {getIcon()}
                        </Box>
                        <Typography variant="body2" fontWeight="bold">{integration.name}</Typography>
                    </Box>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                     <Typography variant="caption" color="text.secondary">
                        Last sync: {integration.lastSync}
                     </Typography>
                     <Chip 
                        label={integration.status} 
                        size="small" 
                        color={isConn ? 'success' : 'warning'} 
                        variant={isConn ? 'outlined' : 'filled'}
                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 'bold' }}
                    />
                </Stack>
            </Stack>
        </Card>
    )
}

export const IntegrationsHealth = () => {
  return (
    <Card sx={{ height: "100%", borderRadius: 3, boxShadow: '0px 2px 10px rgba(0,0,0,0.03)' }}>
      <CardHeader 
        title="Integrations Health" 
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
      />
      <CardContent sx={{ pt: 1 }}>
        <Grid container spacing={2}>
            {mockIntegrations.map(int => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={int.id}>
                    <IntegrationCard integration={int} />
                </Grid>
            ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
