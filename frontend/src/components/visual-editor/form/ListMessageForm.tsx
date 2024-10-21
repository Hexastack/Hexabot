/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

import { ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import AutoCompleteSelect from "@/app-components/inputs/AutoCompleteSelect";
import { Input } from "@/app-components/inputs/Input";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import { useGet } from "@/hooks/crud/useGet";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import {
  ContentField,
  ContentFieldType,
  IContentType,
} from "@/types/content-type.types";
import { OutgoingMessageFormat } from "@/types/message.types";

import { useBlock } from "./BlockFormProvider";
import { FormSectionTitle } from "./FormSectionTitle";
import ButtonsInput from "./inputs/message/ButtonsInput";

const ListMessageForm = () => {
  const block = useBlock();
  const { t } = useTranslate();
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const contentTypeId = watch("options.content.entity");
  const displayMode = watch("options.content.display_mode");
  const { data: contentType } = useGet(contentTypeId, {
    entity: EntityType.CONTENT_TYPE,
  });
  const content = block?.options?.content;

  return (
    <Grid container>
      <Grid item xs={5}>
        <FormSectionTitle title={t("label.list")} Icon={ListIcon} />
        <ContentItem>
          <FormControl>
            <FormLabel>{t("label.display_mode")}</FormLabel>
            <Controller
              rules={{ required: true }}
              control={control}
              defaultValue={content?.display || "list"}
              name="options.content.display_mode"
              render={({ field }) => (
                <RadioGroup row {...field}>
                  {[
                    OutgoingMessageFormat.list,
                    OutgoingMessageFormat.carousel,
                  ].map((display) => (
                    <FormControlLabel
                      key={display}
                      value={display}
                      control={
                        <Radio
                          defaultChecked={display === content?.display}
                          {...register("options.content.display")}
                        />
                      }
                      label={t(`label.${display}`)}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>
        </ContentItem>
        <ContentItem>
          <FormControl>
            <FormLabel>{t("label.top_element_style")}</FormLabel>
            <Controller
              rules={{ required: true }}
              control={control}
              defaultValue={content?.top_element_style || "large"}
              name="options.content.top_element_style"
              render={({ field }) => (
                <RadioGroup row {...field}>
                  {(["large", "compact"] as const).map((style) => (
                    <FormControlLabel
                      key={style}
                      value={style}
                      control={<Radio />}
                      label={t(`label.${style}`)}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>
        </ContentItem>
        <ContentItem>
          <Input
            defaultValue={content?.limit || 2}
            label={t("label.content_limit")}
            type="number"
            inputProps={{
              maxLength: 25,
              step: "1",
              min: 2,
              max: 4,
            }}
            {...register("options.content.limit", {
              validate: {
                min: (value) =>
                  (value && value >= 2 && value <= 4) ||
                  t("message.invalid_list_limit"),
              },
            })}
            error={errors?.options?.["content"]?.["limit"]}
            helperText={errors?.options?.["content"]?.["limit"]?.message}
          />
        </ContentItem>
        <ContentItem>
          <Controller
            name="options.content.entity"
            rules={{ required: t("message.content_is_required") }}
            control={control}
            defaultValue={content?.entity}
            render={({ field }) => {
              const { onChange, ...rest } = field;

              return (
                <AutoCompleteEntitySelect<IContentType, "name", false>
                  fullWidth={false}
                  searchFields={["name"]}
                  entity={EntityType.CONTENT_TYPE}
                  format={Format.BASIC}
                  idKey="id"
                  labelKey="name"
                  {...rest}
                  label={t("label.content")}
                  error={!!errors?.options?.["content"].entity}
                  helperText={errors?.options?.["content"].entity?.message}
                  multiple={false}
                  noOptionsWarning={t("message.no_content_type")}
                  onChange={(_e, selected) => {
                    onChange(selected?.id);
                  }}
                />
              );
            }}
          />
        </ContentItem>
      </Grid>
      <Grid item xs={1}>
        <Divider orientation="vertical" sx={{ margin: "2rem" }} />
      </Grid>
      <Grid item xs={6}>
        <FormLabel component="h4" sx={{ marginBottom: "1rem" }}>
          {t("title.fields_map")}
        </FormLabel>
        <ContentItem>
          <Controller
            name="options.content.fields.title"
            control={control}
            rules={{
              required: t("message.title_is_required"),
            }}
            defaultValue={content?.fields?.title}
            render={({ field }) => {
              const { onChange, ...rest } = field;

              return (
                <AutoCompleteSelect<ContentField, "label", false>
                  options={(contentType?.fields || []).filter(
                    ({ type }) => ContentFieldType.TEXT === type,
                  )}
                  idKey="name"
                  labelKey="label"
                  label={t("label.title")}
                  multiple={false}
                  {...rest}
                  onChange={(_e, selected) => onChange(selected?.name)}
                  error={!!errors?.options?.["content"]?.fields?.title}
                  helperText={
                    errors?.options?.["content"]?.fields?.title?.message
                  }
                />
              );
            }}
          />
        </ContentItem>
        <ContentItem>
          <Controller
            name="options.content.fields.subtitle"
            control={control}
            defaultValue={content?.fields?.subtitle}
            render={({ field }) => {
              const { onChange, ...rest } = field;

              return (
                <AutoCompleteSelect<ContentField, "label", false>
                  options={(contentType?.fields || []).filter(
                    ({ type }) => ContentFieldType.TEXT === type,
                  )}
                  idKey="name"
                  labelKey="label"
                  label={t("label.subtitle")}
                  multiple={false}
                  onChange={(_e, selected) => onChange(selected?.name)}
                  {...rest}
                />
              );
            }}
          />
        </ContentItem>
        <ContentItem>
          <Controller
            name="options.content.fields.image_url"
            control={control}
            defaultValue={content?.fields?.image_url}
            render={({ field }) => {
              const { onChange, ...rest } = field;

              return (
                <AutoCompleteSelect<ContentField, "label", false>
                  options={(contentType?.fields || []).filter(({ type }) =>
                    [ContentFieldType.FILE].includes(type),
                  )}
                  idKey="name"
                  labelKey="label"
                  label={t("label.image_url")}
                  multiple={false}
                  onChange={(_e, selected) => onChange(selected?.name)}
                  {...rest}
                />
              );
            }}
          />
        </ContentItem>
        <ContentItem>
          <Controller
            name="options.content.fields.url"
            control={control}
            defaultValue={content?.fields?.url}
            render={({ field }) => {
              const { onChange, ...rest } = field;

              return (
                <AutoCompleteSelect<ContentField, "label", false>
                  options={(contentType?.fields || []).filter(({ type }) =>
                    [ContentFieldType.URL].includes(type),
                  )}
                  idKey="name"
                  labelKey="label"
                  label={t("label.url")}
                  multiple={false}
                  onChange={(_e, selected) => onChange(selected?.name)}
                  {...rest}
                />
              );
            }}
          />
        </ContentItem>
      </Grid>
      <ContentItem>
        <FormSectionTitle title={t("label.buttons")} Icon={ButtonsIcon} />
        <Controller
          name="options.content.buttons"
          control={control}
          defaultValue={content?.buttons || []}
          render={({ field }) => {
            const { value, onChange } = field;

            return (
              <ButtonsInput
                fieldPath="options.content.buttons"
                value={value}
                onChange={(buttons) => {
                  onChange(buttons);
                }}
                disablePayload={true}
                maxInput={displayMode === "list" ? 1 : 2}
              />
            );
          }}
        />
      </ContentItem>
    </Grid>
  );
};

ListMessageForm.displayName = "ListMessageForm";

export default ListMessageForm;
