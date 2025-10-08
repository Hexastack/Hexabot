/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { MenuForm } from "./MenuForm";

export const MenuFormDialog = (
  props: ComponentFormDialogProps<typeof MenuForm>,
) => (
  <GenericFormDialog
    Form={MenuForm}
    addText="title.add_menu_item"
    editText="title.edit_menu_item"
    {...props}
  />
);
