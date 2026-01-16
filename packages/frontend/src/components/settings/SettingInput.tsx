/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FormControlLabel, Switch } from "@mui/material";
import { Key as KeyIcon } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import MultipleAttachmentInput from "@/app-components/attachment/MultipleAttachmentInput";
import { Adornment } from "@/app-components/inputs/Adornment";
import { Input } from "@/app-components/inputs/Input";
import MultipleInput from "@/app-components/inputs/MultipleInput";
import { PasswordInput } from "@/app-components/inputs/PasswordInput";
import { useTranslate } from "@/hooks/useTranslate";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { ISetting, SettingType } from "@/types/setting.types";
import { MIME_TYPES } from "@/utils/attachment";

interface RenderSettingInputProps {
  setting: ISetting;
  field: ControllerRenderProps<any, string>;
  ns: string;
  isDisabled?: (setting: ISetting) => boolean;
}

const SettingInput: React.FC<RenderSettingInputProps> = ({
  setting,
  field,
  ns,
  isDisabled = () => false,
}) => {
  const { t } = useTranslate(ns);
  const label = t(`label.${setting.label}`, {
    defaultValue: setting.label,
  });
  const helperText = t(`help.${setting.label}`, {
    defaultValue: "",
  });

  switch (setting.type) {
    case SettingType.text:
    case "textarea":
      return (
        <Input
          label={label}
          helperText={helperText}
          multiline={setting.type === "textarea"}
          {...field}
          disabled={isDisabled(setting)}
        />
      );
    case "secret":
      return (
        <PasswordInput
          label={label}
          helperText={helperText}
          slotProps={{
            input: {
              startAdornment: <Adornment Icon={KeyIcon} />,
            },
          }}
          {...field}
        />
      );
    case "multiple_text":
      return (
        <MultipleInput
          multiline={true}
          label={label}
          helperText={helperText}
          {...field}
          minInput={1}
          disabled={isDisabled(setting)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          slotProps={{
            htmlInput: setting.config
              ? {
                  step: setting.config.step,
                  min: setting.config.min,
                  max: setting.config.max,
                }
              : {},
          }}
          label={label}
          helperText={helperText}
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
          disabled={isDisabled(setting)}
        />
      );
    case "checkbox":
      return (
        <FormControlLabel
          label={label}
          {...field}
          control={<Switch checked={field.value} />}
        />
      );
    case "attachment":
      return (
        <AttachmentInput
          label={label}
          {...field}
          value={field.value}
          accept={MIME_TYPES["images"].join(",")}
          format="full"
          size={128}
          resourceRef={AttachmentResourceRef.SettingAttachment}
        />
      );

    case SettingType.multiple_attachment:
      return (
        <MultipleAttachmentInput
          label={label}
          {...field}
          value={field.value}
          accept={MIME_TYPES["images"].join(",")}
          format="full"
          size={128}
          resourceRef={AttachmentResourceRef.SettingAttachment}
        />
      );
    default:
      return <Input {...field} />;
  }
};

SettingInput.displayName = "SettingInput";

export default SettingInput;
