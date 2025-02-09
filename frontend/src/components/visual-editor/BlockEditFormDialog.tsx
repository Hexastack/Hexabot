/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { GenericFormDialog } from "@/app-components/dialogs";
import { IBlock } from "@/types/block.types";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { BlockEditForm } from "./BlockEditForm";

export const BlockEditFormDialog = <
  T extends IBlock | undefined = IBlock | undefined,
>(
  props: ComponentFormDialogProps<T>,
) => (
  <GenericFormDialog<T>
    Form={BlockEditForm}
    editText="title.edit_block"
    {...props}
  />
);
