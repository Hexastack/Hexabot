/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button, Grid } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { FormButtonsProps } from "@/types/common/dialogs.types";

export const DialogFormButtons = ({ onCancel, onSubmit }: FormButtonsProps) => {
  const { t } = useTranslate();

  return (
    <Grid
      p="0.3rem 1rem"
      width="100%"
      display="flex"
      justifyContent="space-between"
    >
      <Button
        color="error"
        variant="outlined"
        onClick={onCancel}
        startIcon={<CloseIcon />}
      >
        {t("button.cancel")}
      </Button>
      <Button
        type="button"
        variant="contained"
        onClick={onSubmit}
        startIcon={<CheckIcon />}
      >
        {t("button.submit")}
      </Button>
    </Grid>
  );
};
