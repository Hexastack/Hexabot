/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, useFormContext } from "react-hook-form";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { ContentItem } from "@/app-components/dialogs";
import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import { useTranslate } from "@/hooks/useTranslate";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { IBlockAttributes } from "@/types/block.types";
import { FileType } from "@/types/message.types";
import { MIME_TYPES, getFileType } from "@/utils/attachment";

import { useBlock } from "./BlockFormProvider";
import { FormSectionTitle } from "./FormSectionTitle";

const AttachmentMessageForm = () => {
  const block = useBlock();
  const { t } = useTranslate();
  const {
    control,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  if (!(block?.message && "attachment" in block?.message)) {
    return null;
  }

  return (
    <ContentItem>
      <FormSectionTitle title={t("label.attachment")} Icon={AttachmentIcon} />
      <Controller
        name="message.attachment"
        control={control}
        rules={{
          validate: {
            required: (value) => {
              return (
                !!value?.payload?.id || t("message.attachment_is_required")
              );
            },
          },
        }}
        defaultValue={block?.message?.attachment}
        render={({ field }) => {
          const { value, onChange, ...rest } = field;

          return (
            <AttachmentInput
              label=""
              {...rest}
              value={value.payload?.id}
              accept={Object.values(MIME_TYPES).flat().join(",")}
              format="full"
              size={256}
              error={!!errors?.message?.["attachment"]?.message}
              helperText={errors?.message?.["attachment"]?.message}
              onChange={(id, type) => {
                onChange({
                  type: type ? getFileType(type) : FileType.unknown,
                  payload: {
                    id,
                  },
                });
              }}
              resourceRef={AttachmentResourceRef.BlockAttachment}
            />
          );
        }}
      />
    </ContentItem>
  );
};

AttachmentMessageForm.displayName = "AttachmentMessageForm";

export default AttachmentMessageForm;
