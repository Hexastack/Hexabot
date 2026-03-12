/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, ButtonProps } from "@mui/material";
import { Trash2 } from "lucide-react";

import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { useTranslate } from "@/hooks/useTranslate";
import { ConfirmOptions } from "@/types/common/dialogs.types";

import { BASE_ADD_DIALOG_MAP } from "../../dialogs/dialog.constants";

export const DeleteEntityButton = <
  TE extends keyof typeof BASE_ADD_DIALOG_MAP,
>({
  entity,
  slotProps,
  confirmOptions = { mode: "click" },
}: {
  entity: TE;
  slotProps?: ButtonProps;
  confirmOptions?: ConfirmOptions & { ids?: string[] };
}) => {
  const { t } = useTranslate();
  const { confirmToDeleteEntity } = useDeleteEntity(entity);

  return (
    <Button
      size="small"
      color="error"
      variant="contained"
      onClick={() => confirmToDeleteEntity(confirmOptions)}
      startIcon={<Trash2 size={18} />}
      {...slotProps}
    >
      {t("button.delete")}
    </Button>
  );
};
