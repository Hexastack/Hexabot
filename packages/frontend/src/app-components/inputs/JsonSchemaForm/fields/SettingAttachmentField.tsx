/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { FieldProps } from "@rjsf/utils";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { useTranslate } from "@/hooks/useTranslate";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { MIME_TYPES } from "@/utils/attachment";

const SETTING_ATTACHMENT_ACCEPT = MIME_TYPES.images.join(",");

export const SettingAttachmentField = ({
  schema,
  formData,
  onChange,
  required,
  disabled,
  readonly,
}: FieldProps) => {
  const { t } = useTranslate();
  const label = schema.title || t("label.attachment");
  const isReadOnly = disabled || readonly;

  return (
    <AttachmentInput
      label={label}
      required={required}
      value={typeof formData === "string" ? formData : null}
      format="full"
      accept={SETTING_ATTACHMENT_ACCEPT}
      enableMediaLibrary={!isReadOnly}
      size={128}
      onChange={(id) => onChange(id, [])}
      resourceRef={AttachmentResourceRef.SettingAttachment}
    />
  );
};
