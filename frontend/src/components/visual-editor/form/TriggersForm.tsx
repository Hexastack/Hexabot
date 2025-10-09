/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Divider } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";
import { IChannel } from "@/types/channel.types";
import { ILabelFull } from "@/types/label.types";

import { useBlock } from "./BlockFormProvider";
import PatternsInput from "./inputs/triggers/PatternsInput";

export const TriggersForm = () => {
  const block = useBlock();
  const { t } = useTranslate();
  const { control } = useFormContext<IBlockAttributes>();

  return (
    <ContentContainer>
      <ContentItem>
        <PatternsInput />
      </ContentItem>
      <Divider orientation="horizontal" flexItem />
      <ContentItem>
        <Controller
          name="trigger_labels"
          control={control}
          defaultValue={block?.trigger_labels || []}
          render={({ field }) => {
            const { onChange, ...rest } = field;

            return (
              <AutoCompleteEntitySelect<ILabelFull, "title">
                searchFields={["title", "name"]}
                entity={EntityType.LABEL}
                format={Format.BASIC}
                labelKey="title"
                label={t("label.labeled_with")}
                multiple={true}
                onChange={(_e, selected, ..._) =>
                  onChange(selected.map(({ id }) => id))
                }
                {...rest}
              />
            );
          }}
        />
      </ContentItem>
      <ContentItem>
        <Controller
          name="trigger_channels"
          control={control}
          defaultValue={block?.trigger_channels || []}
          render={({ field }) => {
            const { onChange, ...rest } = field;

            return (
              <AutoCompleteEntitySelect<IChannel, "name">
                searchFields={["name"]}
                entity={EntityType.CHANNEL}
                format={Format.BASIC}
                idKey="name"
                labelKey="name"
                multiple={true}
                onChange={(_e, selected, ..._) => {
                  onChange((selected || [])?.map(({ name }) => name));
                }}
                label={t("label.from_channels")}
                {...rest}
              />
            );
          }}
        />
      </ContentItem>
    </ContentContainer>
  );
};

TriggersForm.displayName = "TriggersForm";
