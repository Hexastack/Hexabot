/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { NlpEntityVarForm } from "./NlpEntityForm";

export const NlpEntityFormDialog = (
  props: ComponentFormDialogProps<typeof NlpEntityVarForm>,
) => (
  <GenericFormDialog
    Form={NlpEntityVarForm}
    addText="title.new_nlp_entity"
    editText="title.edit_nlp_entity"
    {...props}
  />
);
