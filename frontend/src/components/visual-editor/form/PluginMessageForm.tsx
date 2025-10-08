/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { FormControl } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import SettingInput from "@/components/settings/SettingInput";
import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";
import { StdPluginMessage } from "@/types/message.types";
import { getNamespace } from "@/utils/string";

import { useBlock } from "./BlockFormProvider";

const PluginMessageForm = () => {
  const block = useBlock();
  const { control, register } = useFormContext<IBlockAttributes>();
  const { data: settings } = useFind(
    {
      entity: EntityType.CUSTOM_BLOCK_SETTINGS,
    },
    {
      params: {
        plugin:
          block?.message && "plugin" in block?.message
            ? block.message.plugin
            : "",
      },
      hasCount: false,
    },
  );

  if (!(block?.message && "plugin" in block.message)) {
    return null;
  }

  const message = block.message as StdPluginMessage;

  return (
    <>
      <Input
        value={message.plugin}
        {...register("message.plugin")}
        type="hidden"
        // MUI TextField doesn't support 'hidden', so we make it invisible like this
        sx={{ display: "none" }}
      />
      {(settings || []).map((setting) => (
        <ContentItem key={setting.label}>
          <Controller
            name={`message.args.${setting.label}`}
            control={control}
            defaultValue={message.args?.[setting.label] || setting.value}
            render={({ field }) => (
              <FormControl fullWidth sx={{ paddingTop: ".75rem" }}>
                <SettingInput
                  setting={setting}
                  field={field}
                  ns={getNamespace(message.plugin)}
                />
              </FormControl>
            )}
          />
        </ContentItem>
      ))}
    </>
  );
};

PluginMessageForm.displayName = "TextMessageForm";

export default PluginMessageForm;
