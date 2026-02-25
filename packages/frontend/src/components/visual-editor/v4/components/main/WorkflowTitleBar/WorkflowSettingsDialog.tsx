/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { WorkflowSettingsForm } from "./WorkflowSettingsForm";

export const WorkflowSettingsDialog = (
  props: ComponentFormDialogProps<typeof WorkflowSettingsForm>,
) => (
  <GenericFormDialog
    Form={WorkflowSettingsForm}
    addText="visual_editor.workflow_title_bar.settings.title"
    editText="visual_editor.workflow_title_bar.settings.title"
    {...props}
  />
);
