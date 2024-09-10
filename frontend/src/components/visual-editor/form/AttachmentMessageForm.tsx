/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { ContentItem } from "@/app-components/dialogs";
import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import { IBlockAttributes } from "@/types/block.types";
import { FileType } from "@/types/message.types";
import { MIME_TYPES, getFileType } from "@/utils/attachment";

import { useBlock } from "./BlockFormProvider";
import { FormSectionTitle } from "./FormSectionTitle";

const AttachmentMessageForm = () => {
  const block = useBlock();
  const { t } = useTranslation();
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
                !!value?.payload?.attachment_id ||
                t("message.attachment_is_required")
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
              value={value.payload?.attachment_id}
              accept={Object.values(MIME_TYPES).flat().join(",")}
              format="full"
              size={256}
              error={!!errors?.message?.["attachment"]?.message}
              helperText={errors?.message?.["attachment"]?.message}
              onChange={(id, type) => {
                onChange({
                  type: type ? getFileType(type) : FileType.unknown,
                  payload: {
                    attachment_id: id,
                  },
                });
              }}
            />
          );
        }}
      />
    </ContentItem>
  );
};

AttachmentMessageForm.displayName = "AttachmentMessageForm";

export default AttachmentMessageForm;
