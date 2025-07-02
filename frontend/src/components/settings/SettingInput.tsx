/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import KeyIcon from "@mui/icons-material/Key";
import {
  Box,
  FormControlLabel,
  ListItem,
  ListItemText,
  ListSubheader,
  MenuItem,
  Switch,
} from "@mui/material";
import { ControllerRenderProps } from "react-hook-form";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import MultipleAttachmentInput from "@/app-components/attachment/MultipleAttachmentInput";
import { Adornment } from "@/app-components/inputs/Adornment";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import MultipleInput from "@/app-components/inputs/MultipleInput";
import { PasswordInput } from "@/app-components/inputs/PasswordInput";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { IEntityMapTypes } from "@/types/base.types";
import { IBlock } from "@/types/block.types";
import { ISetting, SettingType } from "@/types/setting.types";
import { MIME_TYPES } from "@/utils/attachment";

interface RenderSettingInputProps {
  setting: ISetting;
  field: ControllerRenderProps<any, string>;
  ns: string;
  isDisabled?: (setting: ISetting) => boolean;
}

const DEFAULT_HELPER_ENTITIES: Record<string, keyof IEntityMapTypes> = {
  ["default_nlu_helper"]: EntityType.NLU_HELPER,
  ["default_llm_helper"]: EntityType.LLM_HELPER,
  ["default_flow_escape_helper"]: EntityType.FLOW_ESCAPE_HELPER,
  ["default_storage_helper"]: EntityType.STORAGE_HELPER,
};
const SettingInput: React.FC<RenderSettingInputProps> = ({
  setting,
  field,
  ns,
  isDisabled = () => false,
}) => {
  const { t } = useTranslate(ns);
  const getCategoryFromCache = useGetFromCache(EntityType.CATEGORY);
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
    case "select": {
      if (setting.config?.["entity"] === "Block") {
        const { onChange, ...rest } = field;

        return (
          <AutoCompleteEntitySelect<IBlock, "name", false>
            idKey={setting.config?.["idKey"]}
            entity={setting.config?.["entity"]}
            multiple={setting.config?.["multiple"]}
            labelKey={setting.config?.["labelKey"]}
            sortKey="category"
            searchFields={["name"]}
            format={Format.FULL}
            label={label}
            groupBy={({ category }) =>
              getCategoryFromCache(category)?.label ?? t("label.other")
            }
            onChange={(_e, selected) => onChange(selected?.id)}
            renderOption={(props, { id, name }) => (
              <ListItem {...props} key={id}>
                <ListItemText primary={name} />
              </ListItem>
            )}
            renderGroup={({ key, group, children }) => (
              <Box key={key}>
                <ListSubheader
                  sx={{
                    top: "-8px",
                    border: "0.5px solid #eee",
                    bgcolor: "#fafafaee",
                    fontSize: "1rem",
                    fontWeight: "bold",
                  }}
                  color="primary"
                >
                  {group}
                </ListSubheader>
                {children}
              </Box>
            )}
            {...rest}
          />
        );
      } else if (
        setting.label.startsWith("default_") &&
        setting.label.endsWith("_helper")
      ) {
        const { onChange, ...rest } = field;

        return (
          <AutoCompleteEntitySelect<any, string, boolean>
            searchFields={["name"]}
            entity={DEFAULT_HELPER_ENTITIES[setting.label]}
            format={Format.BASIC}
            labelKey={setting.config?.labelKey || "name"}
            idKey={setting.config?.idKey || "name"}
            label={label}
            helperText={helperText}
            multiple={!!setting.config?.multiple}
            onChange={(_e, selected, ..._) =>
              onChange(selected?.[setting.config?.idKey || "name"])
            }
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
