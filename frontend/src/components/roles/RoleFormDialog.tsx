/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { RoleForm } from "./RoleForm";

export const RoleFormDialog = (
  props: ComponentFormDialogProps<typeof RoleForm>,
) => (
  <GenericFormDialog
    Form={RoleForm}
    addText="title.new_role"
    editText="title.edit_role"
    {...props}
  />
);
