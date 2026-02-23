/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { CredentialForm } from "./CredentialForm";

export const CredentialFormDialog = (
  props: ComponentFormDialogProps<typeof CredentialForm>,
) => (
  <GenericFormDialog
    Form={CredentialForm}
    addText="title.new_credential"
    editText="title.edit_credential"
    {...props}
  />
);
