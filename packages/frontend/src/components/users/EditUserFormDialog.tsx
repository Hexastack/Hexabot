/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { EditUserForm } from "./EditUserForm";

export const EditUserFormDialog = (
  props: ComponentFormDialogProps<typeof EditUserForm>,
) => (
  <GenericFormDialog
    Form={EditUserForm}
    editText="title.manage_roles"
    {...props}
  />
);
