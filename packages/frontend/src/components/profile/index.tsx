/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import { User } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";

import { McpTokensPanel } from "./McpTokensPanel";
import { ProfileForm } from "./profile";

export const Profile = () => {
  const { t } = useTranslate();
  const { user } = useAuth();
  const { mcpEnabled } = useConfig();

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={User} title={t("title.edit_my_account")} />
      <Grid size={12} container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: mcpEnabled ? 4 : 12 }} sx={{ minWidth: 0 }}>
          <Paper sx={{ p: { xs: 3, md: 4 }, width: "100%" }}>
            {user ? <ProfileForm compact={mcpEnabled} user={user} /> : null}
          </Paper>
        </Grid>
        {mcpEnabled ? (
          <Grid size={{ xs: 12, lg: 8 }} sx={{ minWidth: 0 }}>
            <McpTokensPanel />
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  );
};
