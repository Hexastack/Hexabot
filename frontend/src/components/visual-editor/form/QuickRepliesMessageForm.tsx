/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Controller, useFormContext } from "react-hook-form";

import { ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes } from "@/types/block.types";

import { useBlock } from "./BlockFormProvider";
import { FormSectionTitle } from "./FormSectionTitle";
import QuickRepliesInput from "./inputs/message/QuickRepliesInput";

const QuickRepliesMessageForm = () => {
  const block = useBlock();
  const { t } = useTranslate();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  if (!(block?.message && "quickReplies" in block.message)) {
    return null;
  }

  return (
    <>
      {block?.message && "text" in block?.message ? (
        <>
          <FormSectionTitle title={t("label.message")} Icon={SimpleTextIcon} />
          <ContentItem>
            <Input
              label={t("label.message")}
              required
              multiline={true}
              defaultValue={block?.message.text || ""}
              minRows={3}
              helperText={errors?.message?.["text"]?.message}
              error={!!errors?.message?.["text"]}
              {...register("message.text", {
                required: t("message.message_is_required"),
              })}
            />
          </ContentItem>
        </>
      ) : null}
      <FormSectionTitle
        title={t("label.quick_replies")}
        Icon={QuickRepliesIcon}
      />
      <ContentItem>
        <Controller
          name="message.quickReplies"
          control={control}
          defaultValue={block?.message?.quickReplies || []}
          render={({ field }) => (
            <QuickRepliesInput
              value={field?.value || []}
              onChange={field.onChange}
              minInput={"attachment" in block.message ? 0 : 1}
            />
          )}
        />
      </ContentItem>
    </>
  );
};

QuickRepliesMessageForm.displayName = "TextMessageForm";

export default QuickRepliesMessageForm;
