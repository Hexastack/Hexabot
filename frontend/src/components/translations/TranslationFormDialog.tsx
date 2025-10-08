/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { TranslationForm } from "./TranslationForm";

export const TranslationFormDialog = (
  props: ComponentFormDialogProps<typeof TranslationForm>,
) => (
  <GenericFormDialog
    Form={TranslationForm}
    editText="title.update_translation"
    {...props}
  />
);
