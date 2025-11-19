/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { ContentTypeForm } from "./ContentTypeForm";

export const ContentTypeFormDialog = (
  props: ComponentFormDialogProps<typeof ContentTypeForm>,
) => (
  <GenericFormDialog
    Form={ContentTypeForm}
    addText="title.new_content_type"
    editText="title.edit_content_type"
    {...props}
  />
);
