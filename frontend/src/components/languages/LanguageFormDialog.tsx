/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC } from "react";

import { FormDialog } from "@/app-components/dialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";
import { ILanguage } from "@/types/language.types";

import { LanguageForm } from "./LanguageForm";

export const LanguageFormDialog: FC<ComponentFormDialogProps<ILanguage>> = ({
  payload,
  ...rest
}) => {
  const { t } = useTranslate();

  return (
    <LanguageForm
      data={payload}
      onSuccess={() => {
        rest.onClose(true);
      }}
      Wrapper={FormDialog}
      WrapperProps={{
        title: payload ? t("title.edit_language") : t("title.new_language"),
        ...rest,
      }}
    />
  );
};
