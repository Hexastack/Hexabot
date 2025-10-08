/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import SendIcon from "@mui/icons-material/Send";

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { InviteUserForm } from "./InviteUserForm";

export const InviteUserFormDialog = (
  props: ComponentFormDialogProps<typeof InviteUserForm>,
) => (
  <GenericFormDialog
    Form={InviteUserForm}
    addText="title.invite_new_user"
    confirmButtonProps={{ startIcon: <SendIcon /> }}
    {...props}
  />
);
