/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
