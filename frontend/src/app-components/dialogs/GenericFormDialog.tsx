/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React from "react";

import { FormDialog as Wrapper } from "@/app-components/dialogs";
import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { ComponentFormDialogProps } from "@/types/common/dialogs.types";

type GenericFormDialogProps<T> = ComponentFormDialogProps<T> & {
  Form: React.ElementType;
  rowKey?: keyof T;
  addText?: TTranslationKeys;
  editText?: TTranslationKeys;
};

export const GenericFormDialog = <T,>({
  Form,
  rowKey,
  payload: data,
  editText,
  addText,
  ...rest
}: GenericFormDialogProps<T>) => {
  const { t } = useTranslate();
  const hasRow = rowKey ? data?.[rowKey] : data;
  const translationKey = hasRow ? editText : addText;

  return (
    <Form
      onSuccess={() => {
        rest.onClose(true);
      }}
      WrapperProps={{
        title: translationKey && t(translationKey),
        ...rest,
      }}
      {...{ data, Wrapper }}
    />
  );
};
