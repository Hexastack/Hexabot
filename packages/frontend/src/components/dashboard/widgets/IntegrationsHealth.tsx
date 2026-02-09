/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Card, CardContent, CardHeader, Grid } from "@mui/material";

import { IntegrationCard } from "../components/IntegrationCard";
import { mockIntegrations } from "../mockData";

export const IntegrationsHealth = () => {
  return (
    <Card>
      <CardHeader
        title="Integrations Health"
        slotProps={{ title: { variant: "h6", fontWeight: "bold" } }}
      />
      <CardContent sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          {mockIntegrations.map((int) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={int.id}>
              <IntegrationCard integration={int} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
