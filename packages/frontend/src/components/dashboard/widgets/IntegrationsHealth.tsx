/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CardContent, Grid } from "@mui/material";

import { IntegrationCard } from "../components/IntegrationCard";
import { TitleWithActions } from "../components/TitleWithActions";
import { mockIntegrations } from "../mockData";

export const IntegrationsHealth = () => {
  return (
    <>
      <TitleWithActions title="Integrations Health" />
      <CardContent>
        <Grid container spacing={2}>
          {mockIntegrations.map(({ id, ...rest }) => (
            <Grid size={{ xs: 12, sm: 6, md: 6 }} key={id}>
              <IntegrationCard {...rest} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </>
  );
};
