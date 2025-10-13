/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { LabelForm } from "./LabelForm";

export const LabelFormDialog = (
  props: ComponentFormDialogProps<typeof LabelForm>,
) => (
  <GenericFormDialog
    Form={LabelForm}
    addText="title.new_label"
    editText="title.edit_label"
    {...props}
  />
);
