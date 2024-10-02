/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import KeyIcon from "@mui/icons-material/Key";
import { FormControlLabel, MenuItem, Switch } from "@mui/material";
import { ControllerRenderProps } from "react-hook-form";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { Adornment } from "@/app-components/inputs/Adornment";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import MultipleInput from "@/app-components/inputs/MultipleInput";
import { PasswordInput } from "@/app-components/inputs/PasswordInput";
import { useTranslate } from "@/hooks/useTranslate";
import { TNestedTranslation } from "@/i18n/i18n.types";
import { EntityType, Format } from "@/services/types";
import { IBlock } from "@/types/block.types";
import { ISetting } from "@/types/setting.types";
import { MIME_TYPES } from "@/utils/attachment";

interface RenderSettingInputProps {
  setting: ISetting;
  field: ControllerRenderProps<any, string>;
  isDisabled?: (setting: ISetting) => boolean;
}

const SettingInput: React.FC<RenderSettingInputProps> = ({
  setting,
  field,
  isDisabled = () => false,
}) => {
  const { t } = useTranslate();
  const nestedLabel = setting.label as TNestedTranslation<"label">;
  const nestedHelp = setting.label as TNestedTranslation<"help">;
  const label = t("label", nestedLabel);
  const helperText = t("help", nestedHelp);

  switch (setting.type) {
    case "text":
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
          InputProps={{
            startAdornment: <Adornment Icon={KeyIcon} />,
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
          inputProps={
            setting.config
              ? {
                  step: setting.config.step,
                  min: setting.config.min,
                  max: setting.config.max,
                }
              : {}
          }
          label={label}
          helperText={helperText}
          {...field}
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
    case "select": {
      if (setting.label === "fallback_block") {
        const { onChange, ...rest } = field;

        return (
          <AutoCompleteEntitySelect<IBlock, "name", false>
            searchFields={["name"]}
            entity={EntityType.BLOCK}
            format={Format.BASIC}
            labelKey="name"
            label={t("label.fallback_block")}
            multiple={false}
            onChange={(_e, selected, ..._) => onChange(selected?.id)}
            {...rest}
          />
        );
      }

      return (
        <Input
          select
          inputProps={{ multiple: setting.config?.multiple }}
          helperText={helperText}
          label={label}
          {...field}
        >
          {(setting.options || []).map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Input>
      );
    }
    case "attachment":
      return (
        <AttachmentInput
          label={label}
          {...field}
          value={field.value}
          accept={MIME_TYPES["images"].join(",")}
          format="full"
          size={128}
        />
      );
    default:
      return <Input {...field} />;
  }
};

SettingInput.displayName = "SettingInput";

export default SettingInput;
