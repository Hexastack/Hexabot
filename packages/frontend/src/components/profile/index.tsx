/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { Grid, Paper } from "@mui/material";
import React from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";

import { ProfileForm } from "./profile";

export const Profile = () => {
  const { t } = useTranslate();
  const { user } = useAuth();

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={faUser} title={t("title.edit_my_account")} />
      <Paper sx={{ padding: 7 }}>
        {user ? <ProfileForm user={user} /> : null}
      </Paper>
    </Grid>
  );
};
