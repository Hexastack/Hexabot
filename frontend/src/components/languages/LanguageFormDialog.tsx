/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { LanguageForm } from "./LanguageForm";

export const LanguageFormDialog = (
  props: ComponentFormDialogProps<typeof LanguageForm>,
) => (
  <GenericFormDialog
    Form={LanguageForm}
    addText="title.new_language"
    editText="title.edit_language"
    {...props}
  />
);
