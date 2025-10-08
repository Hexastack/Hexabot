/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { AttachmentForm } from "./AttachmentForm";

export const AttachmentFormDialog = (
  props: ComponentFormDialogProps<typeof AttachmentForm>,
) => (
  <GenericFormDialog
    Form={AttachmentForm}
    editText="title.media_library"
    confirmButtonProps={{ value: "button.select" }}
    {...props}
  />
);
