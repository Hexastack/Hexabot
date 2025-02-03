/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */


import { FormDialog } from "@/app-components/dialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { ICategory } from "@/types/category.types";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

import { CategoryForm } from "./CategoryForm";

export const CategoryFormDialog = <T extends ICategory = ICategory>({
  payload,
  ...rest
}: ComponentFormDialogProps<T>) => {
  const { t } = useTranslate();

  return (
    <CategoryForm
      data={payload}
      onSuccess={() => {
        rest.onClose(true);
      }}
      FormWrapper={FormDialog}
      FormWrapperProps={{
        title: payload ? t("title.edit_category") : t("title.new_category"),
        ...rest,
      }}
    />
  );
};
