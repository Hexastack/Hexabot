/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button, Grid } from "@mui/material";

import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { FormButtonsProps } from "@/types/common/dialogs.types";

export const DialogFormButtons = ({
  onSubmit,
  onCancel,
  cancelButtonProps,
  confirmButtonProps,
}: FormButtonsProps) => {
  const { t } = useTranslate();
  const cancelButtonTitle = (cancelButtonProps?.value ||
    "button.cancel") as TTranslationKeys;
  const confirmButtonTitle = (confirmButtonProps?.value ||
    "button.submit") as TTranslationKeys;

  return (
    <Grid
      p="0.3rem 1rem"
      gap={1}
      width="100%"
      display="flex"
      justifyContent="space-between"
    >
      <Button
        color="error"
        variant="outlined"
        onClick={onCancel}
        startIcon={<CloseIcon />}
        {...cancelButtonProps}
      >
        {cancelButtonProps?.text || t(cancelButtonTitle)}
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        startIcon={<CheckIcon />}
        {...confirmButtonProps}
      >
        {confirmButtonProps?.text || t(confirmButtonTitle)}
      </Button>
    </Grid>
  );
};
