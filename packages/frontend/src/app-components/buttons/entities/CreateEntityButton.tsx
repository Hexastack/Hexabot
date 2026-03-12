/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, ButtonProps } from "@mui/material";
import { Plus } from "lucide-react";

import { useEntityDialogs } from "@/hooks/useEntityDialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { THook } from "@/types/base.types";
import { OpenDialogOptions } from "@/types/common/dialogs.types";

import { BASE_ADD_DIALOG_MAP } from "../../dialogs/dialog.constants";

export const CreateEntityButton = <
  TE extends keyof typeof BASE_ADD_DIALOG_MAP,
>({
  entity,
  slotProps,
  openOptions,
}: {
  entity: TE;
  slotProps?: ButtonProps;
  openOptions?: OpenDialogOptions<THook<{ entity: TE }>["basic"]>;
}) => {
  const { t } = useTranslate();
  const entityDialogs = useEntityDialogs(entity);

  return (
    <Button
      size="small"
      variant="contained"
      onClick={() => entityDialogs.open({ defaultValues: null }, openOptions)}
      startIcon={<Plus size={18} />}
      {...slotProps}
    >
      {t("button.add")}
    </Button>
  );
};
