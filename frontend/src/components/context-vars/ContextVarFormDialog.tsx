/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { ContextVarForm } from "./ContextVarForm";

export const ContextVarFormDialog = (
  props: ComponentFormDialogProps<typeof ContextVarForm>,
) => (
  <GenericFormDialog
    Form={ContextVarForm}
    addText="title.new_context_var"
    editText="title.edit_context_var"
    {...props}
  />
);
