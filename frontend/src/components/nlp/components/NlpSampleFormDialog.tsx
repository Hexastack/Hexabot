/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { NlpSampleForm } from "./NlpSampleForm";

export const NlpSampleFormDialog = (
  props: ComponentFormDialogProps<typeof NlpSampleForm>,
) => (
  <GenericFormDialog
    Form={NlpSampleForm}
    editText="title.edit_nlp_sample"
    {...props}
  />
);
