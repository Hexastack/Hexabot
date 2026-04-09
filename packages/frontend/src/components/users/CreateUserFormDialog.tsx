/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UserPlus } from "lucide-react";

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { CreateUserForm } from "./CreateUserForm";

export const CreateUserFormDialog = (
  props: ComponentFormDialogProps<typeof CreateUserForm>,
) => (
  <GenericFormDialog
    Form={CreateUserForm}
    addText="button.add"
    confirmButtonProps={{ startIcon: <UserPlus /> }}
    {...props}
  />
);
