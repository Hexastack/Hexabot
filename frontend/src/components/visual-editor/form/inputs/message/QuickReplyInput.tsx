/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Grid } from "@mui/material";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";

import { Input } from "@/app-components/inputs/Input";
import { ToggleableInput } from "@/app-components/inputs/ToggleableInput";
import { useTranslate } from "@/hooks/useTranslate";
import { IBlockAttributes } from "@/types/block.types";
import { QuickReplyType, StdQuickReply } from "@/types/message.types";

type QuickReplyInputProps = {
  value: StdQuickReply;
  onChange: (pattern: StdQuickReply) => void;
  idx: number;
};

const QuickReplyInput: FC<QuickReplyInputProps> = ({
  value,
  onChange,
  idx,
}) => {
  const { t } = useTranslate();
  const [quickReplyType, _setQuickReplyType] = useState(value.content_type);
  const {
    register,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();

  return (
    <>
      <Grid item xs={5}>
        {quickReplyType !== QuickReplyType.location ? (
          <Input
            value={value.title}
            inputProps={{
              maxLength: 20,
            }}
            {...register(`message.quickReplies.${idx}.title`, {
              required: t("message.title_is_required"),
            })}
            onChange={(e) => {
              onChange({
                content_type: quickReplyType,
                title: e.target.value,
                payload: value.payload,
              });
            }}
            error={!!errors?.message?.["quickReplies"]?.[idx]?.title}
            helperText={
              errors?.message?.["quickReplies"]?.[idx]?.title?.message ||
              (value?.title?.length === 20
                ? t("message.title_length_exceeded")
                : null)
            }
          />
        ) : null}
      </Grid>
      <Grid item xs={6}>
        {quickReplyType !== QuickReplyType.location ? (
          <ToggleableInput
            defaultValue={value.payload}
            readOnlyValue={value.title || ""}
            error={!!errors?.message?.["quickReplies"]?.[idx]?.payload}
            helperText={
              errors?.message?.["quickReplies"]?.[idx]?.payload?.message
            }
            {...register(`message.quickReplies.${idx}.payload`, {
              required: t("message.payload_is_required"),
            })}
            onChange={(payload) => {
              onChange({
                content_type: quickReplyType,
                title: value.title,
                payload,
              });
            }}
          />
        ) : null}
      </Grid>
    </>
  );
};

export default QuickReplyInput;
