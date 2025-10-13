/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MoveUp } from "@mui/icons-material";

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { BlockMoveForm } from "./BlockMoveForm";

export const BlockMoveFormDialog = (
  props: ComponentFormDialogProps<typeof BlockMoveForm>,
) => (
  <GenericFormDialog
    Form={BlockMoveForm}
    editText="message.select_category"
    confirmButtonProps={{ value: "button.move", startIcon: <MoveUp /> }}
    {...props}
  />
);
