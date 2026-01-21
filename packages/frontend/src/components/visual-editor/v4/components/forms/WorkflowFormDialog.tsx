/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { WorkflowForm } from "./WorkflowForm";

export const WorkflowFormDialog = (
  props: ComponentFormDialogProps<typeof WorkflowForm>,
) => (
  <GenericFormDialog
    Form={WorkflowForm}
    addText="title.new_workflow"
    editText="title.edit_workflow"
    {...props}
  />
);
