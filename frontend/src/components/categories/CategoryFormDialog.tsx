/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC } from "react";

import { FormDialog } from "@/app-components/dialogs/FormDialog";
import { DialogProps } from "@/contexts/dialogs.context";
import { useTranslate } from "@/hooks/useTranslate";
import { ICategory } from "@/types/category.types";

import { CategoryForm } from "./CategoryForm";

export type CategoryFormProps = DialogProps<ICategory | null, boolean>;

export const CategoryFormDialog: FC<CategoryFormProps> = ({
  onClose,
  payload,
  ...rest
}) => {
  const { t } = useTranslate();

  return (
    <FormDialog
      title={payload ? t("title.edit_category") : t("title.new_category")}
      {...rest}
      // @TODO: fix typing
      onClose={async () => await onClose(false)}
    >
      <CategoryForm data={payload} />
    </FormDialog>
  );
};
