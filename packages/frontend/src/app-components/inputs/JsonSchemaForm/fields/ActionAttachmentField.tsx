/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AttachmentResourceRef } from "@hexabot-ai/types";
import { Box, Typography } from "@mui/material";
import type { FieldProps, RJSFSchema } from "@rjsf/utils";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { useTranslate } from "@/hooks/useTranslate";
import { getFileType, MIME_TYPES } from "@/utils/attachment";

import { getDescription, LabelWithTooltip } from "../widgets/shared";

type AttachmentValue = {
  type: string;
  payload: {
    id: string | null;
  };
};

const ATTACHMENT_ACCEPT = Array.from(
  new Set(Object.values(MIME_TYPES).flat()),
).join(",");
const getAttachmentValue = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const attachment = value as {
    payload?: {
      id?: string | null;
      url?: string;
    };
  };
  const payload = attachment.payload;

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return {
    id: payload.id ?? null,
    url: payload.url,
  };
};

export const ActionAttachmentField = ({
  schema,
  formData,
  onChange,
  required,
  disabled,
  readonly,
}: FieldProps) => {
  const { t } = useTranslate();
  const label = schema.title || t("label.attachment");
  const description = getDescription(schema as RJSFSchema);
  const currentAttachment = getAttachmentValue(formData);
  const isReadOnly = disabled || readonly;
  const handleChange = (id: string | null, mimeType: string | null) => {
    if (!id || !mimeType) {
      onChange({ attachment: { type: "image", payload: { id: null } } }, []);

      return;
    }

    const value: AttachmentValue = {
      type: getFileType(mimeType),
      payload: { id },
    };

    onChange({ attachment: value }, []);
  };

  return (
    <Box>
      <AttachmentInput
        label={<LabelWithTooltip label={label} description={description} />}
        required={required}
        value={currentAttachment?.id}
        format="full"
        accept={ATTACHMENT_ACCEPT}
        enableMediaLibrary={!isReadOnly}
        size={128}
        onChange={handleChange}
        resourceRef={AttachmentResourceRef.MessageAttachment}
      />
      {!currentAttachment?.id && currentAttachment?.url ? (
        <Typography variant="caption" sx={{ wordBreak: "break-word" }}>
          {currentAttachment.url}
        </Typography>
      ) : null}
    </Box>
  );
};
