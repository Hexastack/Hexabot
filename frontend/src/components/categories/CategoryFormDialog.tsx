/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { CategoryForm } from "./CategoryForm";

export const CategoryFormDialog = (
  props: ComponentFormDialogProps<typeof CategoryForm>,
) => (
  <GenericFormDialog
    Form={CategoryForm}
    addText="title.new_category"
    editText="title.edit_category"
    {...props}
  />
);
