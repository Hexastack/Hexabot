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
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes } from "@/types/block.types";

import { useBlock } from "./BlockFormProvider";
import { FormSectionTitle } from "./FormSectionTitle";
import ButtonsInput from "./inputs/message/ButtonsInput";

const ButtonsMessageForm = () => {
  const block = useBlock();
  const { t } = useTranslate();
  const {
    control,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  if (!(block?.message && "buttons" in block.message)) {
    return null;
  }

  return (
    <>
      <FormSectionTitle title={t("label.message")} Icon={SimpleTextIcon} />
      {block?.message && "text" in block?.message ? (
        <ContentItem>
          <Controller
            name="message.text"
            control={control}
            defaultValue={block?.message.text || ""}
            rules={{ required: t("message.message_is_required") }}
            render={({ field }) => {
              return (
                <Input
                  label={t("label.message")}
                  required
                  helperText={errors?.message?.["text"]?.message}
                  error={!!errors?.message?.["text"]}
                  {...field}
                  multiline={true}
                  minRows={3}
                />
              );
            }}
          />
        </ContentItem>
      ) : null}
      <FormSectionTitle title={t("label.buttons")} Icon={ButtonsIcon} />
      <ContentItem>
        <Controller
          name="message.buttons"
          control={control}
          defaultValue={block?.message.buttons || []}
          render={({ field }) => (
            <ButtonsInput
              value={field.value}
              onChange={field.onChange}
              fieldPath="message.buttons"
            />
          )}
        />
      </ContentItem>
    </>
  );
};

ButtonsMessageForm.displayName = "TextMessageForm";

export default ButtonsMessageForm;
