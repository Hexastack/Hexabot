/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { MemoryDefinitionForm } from "./MemoryDefinitionForm";

export const MemoryDefinitionFormDialog = (
  props: ComponentFormDialogProps<typeof MemoryDefinitionForm>,
) => (
  <GenericFormDialog
    Form={MemoryDefinitionForm}
    addText="title.new_memory_definition"
    editText="title.edit_memory_definition"
    {...props}
  />
);
