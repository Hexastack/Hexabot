/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { AttachmentViewerForm } from "./AttachmentViewerForm";

export const AttachmentViewerFormDialog = (
  props: ComponentFormDialogProps<typeof AttachmentViewerForm>,
) => (
  <GenericFormDialog
    Form={AttachmentViewerForm}
    addText="label.image"
    {...props}
  />
);
