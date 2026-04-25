/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Alert,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { useApiClientQuery } from "@/hooks/useApiClient";
import { useTranslate } from "@/hooks/useTranslate";

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
    <>
      <TitleWithActions title={t("dashboard.integrations.title")} />
      <CardContent>
        {isLoading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            minHeight={160}
            gap={2}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              {t("dashboard.integrations.loading")}
            </Typography>
          </Stack>
        ) : isError ? (
          <Alert severity="error">{t("dashboard.integrations.error")}</Alert>
        ) : integrations.length ? (
          <Grid container spacing={2}>
            {integrations.map(({ id, ...rest }) => (
              <Grid size={{ xs: 12, sm: 6, md: 6 }} key={id}>
                <IntegrationCard {...rest} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">{t("dashboard.integrations.empty")}</Alert>
        )}
      </CardContent>
    </>
  );
};
