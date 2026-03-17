/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { McpServerForm } from "./McpServerForm";

export const McpServerFormDialog = (
  props: ComponentFormDialogProps<typeof McpServerForm>,
) => (
  <GenericFormDialog
    Form={McpServerForm}
    addText="title.new_mcp_server"
    editText="title.edit_mcp_server"
    {...props}
  />
);
