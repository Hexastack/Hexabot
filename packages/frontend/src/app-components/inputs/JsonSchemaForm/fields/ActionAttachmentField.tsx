/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AttachmentResourceRef } from "@hexabot-ai/types";
import { Box, Typography } from "@mui/material";
import {
  getUiOptions,
  type FieldPathList,
  type FieldProps,
  type RJSFSchema,
  type UiSchema,
} from "@rjsf/utils";

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
type ActionAttachmentFieldOptions = {
  wrapInAttachmentKey?: boolean;
  resourceRef?: AttachmentResourceRef;
};
type AttachmentValueChangePayload =
  | AttachmentValue
  | { attachment: AttachmentValue };

const ATTACHMENT_ACCEPT = Array.from(
  new Set(Object.values(MIME_TYPES).flat()),
).join(",");
const getAttachmentValue = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const currentValue = value as {
    attachment?: {
      payload?: {
        id?: string | null;
        url?: string;
      };
    };
    payload?: {
      id?: string | null;
      url?: string;
    };
  };
  const payload = currentValue.attachment?.payload ?? currentValue.payload;

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return {
    id: payload.id ?? null,
    url: payload.url,
  };
};
const buildAttachmentFieldValue = (
  value: AttachmentValue,
  wrapInAttachmentKey: boolean,
) => {
  if (!wrapInAttachmentKey) {
    return value;
  }

  return { attachment: value };
};

export const ActionAttachmentField = ({
  schema,
  uiSchema,
  formData,
  onChange,
  fieldPathId,
  required,
  disabled,
  readonly,
}: FieldProps) => {
  const { t } = useTranslate();
  const options =
    (getUiOptions(uiSchema as UiSchema) as
      | ActionAttachmentFieldOptions
      | undefined) ?? {};
  const wrapInAttachmentKey = options.wrapInAttachmentKey ?? true;
  const resourceRef =
    options.resourceRef ?? AttachmentResourceRef.MessageAttachment;
  const label = schema.title || t("label.attachment");
  const description = getDescription(schema as RJSFSchema);
  const currentAttachment = getAttachmentValue(formData);
  const isReadOnly = disabled || readonly;
  const handleChange = (id: string | null, mimeType: string | null) => {
    const path = fieldPathId.path as FieldPathList;

    if (!id || !mimeType) {
      onChange(
        buildAttachmentFieldValue(
          { type: "image", payload: { id: null } },
          wrapInAttachmentKey,
        ) as AttachmentValueChangePayload,
        path,
      );

      return;
    }

    const value: AttachmentValue = {
      type: getFileType(mimeType),
      payload: { id },
    };

    onChange(
      buildAttachmentFieldValue(value, wrapInAttachmentKey) as
        | AttachmentValueChangePayload
        | undefined,
      path,
    );
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
        resourceRef={resourceRef}
      />
      {!currentAttachment?.id && currentAttachment?.url ? (
        <Typography variant="caption" sx={{ wordBreak: "break-word" }}>
          {currentAttachment.url}
        </Typography>
      ) : null}
    </Box>
  );
};
