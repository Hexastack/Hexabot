/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { SubscriberForm } from "./SubscriberForm";

export const SubscriberFormDialog = (
  props: ComponentFormDialogProps<typeof SubscriberForm>,
) => (
  <GenericFormDialog
    Form={SubscriberForm}
    editText="title.manage_subscribers"
    {...props}
  />
);
