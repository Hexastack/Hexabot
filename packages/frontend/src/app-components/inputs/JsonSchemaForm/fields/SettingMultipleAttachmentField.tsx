/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { FieldProps } from "@rjsf/utils";

import MultipleAttachmentInput from "@/app-components/attachment/MultipleAttachmentInput";
import { useTranslate } from "@/hooks/useTranslate";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { MIME_TYPES } from "@/utils/attachment";

const SETTING_ATTACHMENT_ACCEPT = MIME_TYPES.images.join(",");

export const SettingMultipleAttachmentField = ({
  schema,
  formData,
  onChange,
}: FieldProps) => {
  const { t } = useTranslate();
  const label = schema.title || t("label.attachment");

  return (
    <MultipleAttachmentInput
      label={label}
      value={
        Array.isArray(formData)
          ? formData.filter((value): value is string => typeof value === "string")
          : []
      }
      format="full"
      accept={SETTING_ATTACHMENT_ACCEPT}
      size={128}
      onChange={(ids) => onChange(ids, [])}
      resourceRef={AttachmentResourceRef.SettingAttachment}
    />
  );
};
