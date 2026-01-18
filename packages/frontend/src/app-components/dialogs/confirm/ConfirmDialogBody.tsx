/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Typography, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { AlertTriangle } from "lucide-react";

import { useTranslate } from "@/hooks/useTranslate";

export const ConfirmDialogBody = ({
  mode = "click",
  count = 1,
}: {
  mode?: "selection" | "click";
  count?: number;
}) => {
  const { t } = useTranslate();
  const theme = useTheme();
  const dialogBodyText =
    mode === "selection"
      ? count === 1
        ? t("message.item_selected_delete_confirm")
        : t("message.items_selected_delete_confirm", {
            "0": count.toString(),
          })
      : t("message.item_delete_confirm");

  return (
    <Grid container gap={1}>
      <Grid size="auto" height="1.75rem">
        <AlertTriangle color={theme.palette.error.main} size={28} />
      </Grid>
      <Grid size="auto" alignSelf="center">
        <Typography>{dialogBodyText}</Typography>
      </Grid>
    </Grid>
  );
};
