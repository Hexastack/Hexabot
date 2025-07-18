/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MenuItem } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { ToggleableInput } from "@/app-components/inputs/ToggleableInput";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IMenuItem, IMenuItemAttributes, MenuType } from "@/types/menu.types";
import { isAbsoluteUrl } from "@/utils/URL";

const DEFAULT_VALUES = { title: "", type: MenuType.web_url, url: undefined };

export type MenuFormData = {
  row?: IMenuItem;
  rowId?: string;
  parentId?: string;
};

export const MenuForm: FC<ComponentFormProps<MenuFormData>> = ({
  data: { defaultValues: menu },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createMenu } = useCreate(EntityType.MENU, options);
  const { mutate: updateMenu } = useUpdate(EntityType.MENU, options);
  const {
    watch,
    reset,
    control,
    register,
    formState: { errors },
    resetField,
    handleSubmit,
  } = useForm<IMenuItemAttributes>({
    defaultValues: DEFAULT_VALUES,
  });
  const validationRules = {
    type: {
      required: t("message.type_is_required"),
    },
    title: { required: t("message.title_is_required") },
    url: {
      required: t("message.url_is_invalid"),
      validate: (value: string = "") =>
        isAbsoluteUrl(value) || t("message.url_is_invalid"),
    },
    payload: {},
  };
  const typeValue = watch("type");
  const titleValue = watch("title");
  const onSubmitForm = (params: IMenuItemAttributes) => {
    const { url, ...rest } = params;
    const payload = typeValue === "web_url" ? { ...rest, url } : rest;

    if (menu?.row?.id) {
      updateMenu({
        id: menu.row.id,
        params: payload,
      });
    } else {
      createMenu({ ...payload, parent: menu?.parentId });
    }
  };

  useEffect(() => {
    if (menu?.row) {
      reset(menu.row);
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [reset, menu?.row]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentContainer flexDirection="row">
            <ContentItem>
              <Controller
                name="type"
                rules={validationRules.type}
                control={control}
                render={({ field }) => {
                  const { onChange, ...rest } = field;

                  return (
                    <Input
                      select
                      label={t("placeholder.type")}
                      error={!!errors.type}
                      inputRef={field.ref}
                      required
                      onChange={({ target: { value } }) => {
                        onChange(value);
                        resetField("url");
                      }}
                      helperText={errors.type ? errors.type.message : null}
                      {...rest}
                    >
                      {Object.keys(MenuType).map((value, key) => (
                        <MenuItem value={value} key={key}>
                          {t(`label.${value}`)}
                        </MenuItem>
                      ))}
                    </Input>
                  );
                }}
              />
            </ContentItem>
            <ContentItem flex={1}>
              <Input
                label={t("placeholder.title")}
                error={!!errors.title}
                required
                autoFocus
                helperText={errors.title ? errors.title.message : null}
                {...register("title", validationRules.title)}
              />
            </ContentItem>
          </ContentContainer>
          <ContentItem>
            {typeValue === MenuType.web_url ? (
              <Input
                label={t("label.web_url")}
                error={!!errors.url}
                required
                helperText={errors.url ? errors.url.message : null}
                {...register("url", validationRules.url)}
              />
            ) : typeValue === MenuType.postback ? (
              <Controller
                name="payload"
                control={control}
                render={({ field }) => {
                  return (
                    <ToggleableInput
                      label={t("label.payload")}
                      error={!!errors.payload}
                      required
                      defaultValue={menu?.row?.payload || ""}
                      readOnlyValue={titleValue}
                      helperText={
                        errors.payload ? errors.payload.message : null
                      }
                      {...field}
                    />
                  );
                }}
              />
            ) : null}
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
