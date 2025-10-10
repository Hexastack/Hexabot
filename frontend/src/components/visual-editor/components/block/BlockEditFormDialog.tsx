/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { BlockEditForm } from "./BlockEditForm";

export const BlockEditFormDialog = (
  props: ComponentFormDialogProps<typeof BlockEditForm>,
) => (
  <GenericFormDialog
    Form={BlockEditForm}
    editText="title.edit_block"
    {...props}
  />
);
