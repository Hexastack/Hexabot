/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { SourceForm } from "./SourceForm";

export const SourceFormDialog = (
  props: ComponentFormDialogProps<typeof SourceForm>,
) => (
  <GenericFormDialog
    Form={SourceForm}
    addText="title.new_source"
    editText="title.edit_source"
    {...props}
  />
);
