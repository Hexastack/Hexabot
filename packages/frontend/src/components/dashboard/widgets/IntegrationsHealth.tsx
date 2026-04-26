/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, Grid } from "@mui/material";

import { useApiClientQuery } from "@/hooks/useApiClient";
import { useTranslate } from "@/hooks/useTranslate";

import { DashboardWidgetState } from "../components/DashboardWidgetState";
import { IntegrationCard } from "../components/IntegrationCard";
import { TitleWithActions } from "../components/TitleWithActions";

export const IntegrationsHealth = () => {
  const { t } = useTranslate();
  const { data, isError, isLoading } = useApiClientQuery(
    "getIntegrationHealth",
    {
      refetchInterval: 60000,
    },
  );
  const integrations = data?.integrations ?? [];

  return (
    <Box>
      <TitleWithActions title={t("dashboard.integrations.title")} />
      {isLoading ? (
        <DashboardWidgetState
          loading
          title={t("dashboard.integrations.loading")}
          description={t("dashboard.integrations.loading_description")}
        />
      ) : isError ? (
        <DashboardWidgetState
          tone="error"
          title={t("dashboard.integrations.error")}
          description={t("dashboard.integrations.error_description")}
        />
      ) : integrations.length ? (
        <Grid container spacing={2}>
          {integrations.map(({ id, ...rest }) => (
            <Grid size={{ xs: 12, sm: 6, md: 6 }} key={id}>
              <IntegrationCard {...rest} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <DashboardWidgetState
          title={t("dashboard.integrations.empty")}
          description={t("dashboard.integrations.empty_description")}
        />
      )}
    </Box>
  );
};
