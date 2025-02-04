/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ErrorIcon from "@mui/icons-material/Error";
import { Grid, Typography } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";

export const ConfirmDialogBody = ({
  mode = "click",
  count = 1,
}: {
  mode?: "selection" | "click";
  count?: number;
}) => {
  const { t } = useTranslate();
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
      <Grid item height="1.75rem">
        <ErrorIcon sx={{ fontSize: "1.75rem" }} color="error" />
      </Grid>
      <Grid item alignSelf="center">
        <Typography>{dialogBodyText}</Typography>
      </Grid>
    </Grid>
  );
};
