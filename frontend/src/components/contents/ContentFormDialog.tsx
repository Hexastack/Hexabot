/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { ContentForm } from "./ContentForm";

export const ContentFormDialog = (
  props: ComponentFormDialogProps<typeof ContentForm>,
) => (
  <GenericFormDialog
    Form={ContentForm}
    addText="title.new_content"
    editText="title.edit_node"
    {...props}
  />
);
