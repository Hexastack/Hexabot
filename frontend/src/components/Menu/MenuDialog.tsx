/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  MenuItem,
} from "@mui/material";
import { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { Input } from "@/app-components/inputs/Input";
import { ToggleableInput } from "@/app-components/inputs/ToggleableInput";
import { useTranslate } from "@/hooks/useTranslate";
import { IMenuItem, IMenuItemAttributes, MenuType } from "@/types/menu.types";
import { isAbsoluteUrl } from "@/utils/URL";

export type MenuDialogProps = DialogProps & {
  open: boolean;
  closeFunction?: () => void;
  createFunction?: (_menu: IMenuItemAttributes) => void;
  editFunction?: (_menu: IMenuItemAttributes) => void;
  row?: IMenuItem;
  parentId?: string;
};
const DEFAULT_VALUES = { title: "", type: MenuType.web_url, url: undefined };

export const MenuDialog: FC<MenuDialogProps> = ({
  open,
  closeFunction,
  createFunction,
  editFunction,
  row,
  parentId,
  ...rest
}) => {
  const { t } = useTranslate();
  const {
    reset,
    resetField,
    control,
    formState: { errors },
    handleSubmit,
    register,
    watch,
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
  const onSubmitForm = async (data: IMenuItemAttributes) => {
    if (createFunction) {
      createFunction({ ...data, parent: parentId });
    } else if (editFunction) {
      editFunction({ ...data, parent: parentId });
    }
  };

  useEffect(() => {
    if (open) {
      if (row) {
        reset(row);
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [open, reset, row]);

  const typeValue = watch("type");
  const titleValue = watch("title");

  return (
    <Dialog open={open} fullWidth onClose={closeFunction} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeFunction}>
          {createFunction
            ? t("title.add_menu_item")
            : t("title.edit_menu_item")}
        </DialogTitle>
        <DialogContent>
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
                        defaultValue={row?.payload || ""}
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
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeFunction} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
