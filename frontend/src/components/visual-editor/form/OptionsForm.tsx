/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntityDistinctSelect from "@/app-components/inputs/AutoCompleteEntityDistinctSelect";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";
import { IUser } from "@/types/user.types";

import { useBlock } from "./BlockFormProvider";
import ContextVarsInput from "./inputs/options/ContextVarsInput";
import LocalFallbackInput from "./inputs/options/LocalFallbackInput";

export const OptionsForm = () => {
  const { t } = useTranslate();
  const block = useBlock();
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<IBlockAttributes>();
  const computed = watch("options.typing");

  return (
    <ContentContainer>
      <ContentItem>
        <Input
          fullWidth={false}
          defaultValue={block?.options?.typing || 0}
          label={t("label.typing_indicator")}
          {...register("options.typing", { valueAsNumber: true })}
          type="number"
        />
        <Typography component="span" display="inline-block" p={0.5}>
          = {(computed || 0) / 1000} {t("label.seconds")}
        </Typography>
      </ContentItem>
      <ContentItem>
        <Controller
          name="assign_labels"
          control={control}
          defaultValue={block?.assign_labels || []}
          render={({ field }) => {
            const { onChange, ...rest } = field;

            return (
              <AutoCompleteEntityDistinctSelect
                entity={EntityType.LABEL}
                subEntity={EntityType.LABEL_GROUP}
                error={!!errors.assign_labels}
                helperText={
                  errors.assign_labels ? errors.assign_labels.message : null
                }
                onChange={(_e, selected) =>
                  onChange(selected.map(({ id }) => id))
                }
                label={t("label.assign_labels")}
                labelKey="title"
                sortKey="group"
                groupKey="name"
                defaultGroupTitle={t("title.default_group")}
                {...rest}
              />
            );
          }}
        />
      </ContentItem>
      <ContentItem>
        <Controller
          name="options.assignTo"
          control={control}
          defaultValue={block?.options?.assignTo}
          render={({ field }) => {
            const { onChange, ...rest } = field;

            return (
              <AutoCompleteEntitySelect<
                IUser,
                "first_name" | "last_name",
                false
              >
                multiple={false}
                searchFields={["first_name", "last_name"]}
                entity={EntityType.USER}
                format={Format.BASIC}
                labelKey="first_name"
                label={t("label.assign_to")}
                onChange={(_e, selected) => {
                  onChange(selected?.id);
                }}
                getOptionLabel={(option) => {
                  return `${option.first_name} ${option.last_name}`;
                }}
                {...rest}
              />
            );
          }}
        />
      </ContentItem>
      <ContentItem>
        <Controller
          name="options.fallback"
          control={control}
          defaultValue={block?.options?.fallback}
          rules={{
            validate: (value) => {
              const localFallbackDisabled =
                typeof value?.max_attempts === "number" &&
                value?.max_attempts <= 0;
              const allMessagesNonEmpty =
                Array.isArray(value?.message) &&
                value.message.length > 0 &&
                value.message.every((m) => typeof m === "string" && m.trim());

              return localFallbackDisabled || allMessagesNonEmpty
                ? true
                : t("message.fallback_message_required");
            },
          }}
          render={({ field }) => (
            <LocalFallbackInput
              value={field?.value}
              onChange={field.onChange}
            />
          )}
        />
      </ContentItem>
      <ContentItem>
        <Controller
          name="capture_vars"
          control={control}
          defaultValue={block?.capture_vars || []}
          render={({ field }) => (
            <ContextVarsInput
              value={field?.value || []}
              onChange={field.onChange}
            />
          )}
        />
      </ContentItem>
    </ContentContainer>
  );
};

OptionsForm.displayName = "OptionsForm";
