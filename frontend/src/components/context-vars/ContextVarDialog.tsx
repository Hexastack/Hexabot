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
  FormControlLabel,
  FormHelperText,
  Switch,
} from "@mui/material";
import { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";


import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IContextVar, IContextVarAttributes } from "@/types/context-var.types";
import { slugify } from "@/utils/string";

export type ContextVarDialogProps = DialogControlProps<IContextVar>;
export const ContextVarDialog: FC<ContextVarDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutateAsync: createContextVar } = useCreate(EntityType.CONTEXT_VAR, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: updateContextVar } = useUpdate(EntityType.CONTEXT_VAR, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const {
    reset,
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<IContextVarAttributes>({
    defaultValues: { name: data?.name || "", label: data?.label || "" },
  });
  const validationRules = {
    label: {
      required: t("message.label_is_required"),
    },
    name: {
      pattern: {
        value: /^[a-z_0-9]+$/,
        message: t("message.context_vars_name_is_invalid"),
      },
    },
  };
  const onSubmitForm = async (params: IContextVarAttributes) => {
    if (data) {
      updateContextVar({ id: data.id, params });
    } else {
      createContextVar(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        label: data.label,
        name: data.name,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {data ? t("title.edit_context_var") : t("title.new_context_var")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("label.label")}
                error={!!errors.label}
                required
                autoFocus
                {...register("label", validationRules.label)}
                InputProps={{
                  onChange: ({ target: { value } }) => {
                    setValue("label", value);
                    setValue("name", slugify(value));
                  },
                }}
                helperText={errors.label ? errors.label.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.name")}
                error={!!errors.name}
                disabled
                {...register("name", validationRules.name)}
                helperText={errors.name ? errors.name.message : null}
                InputLabelProps={{ shrink: true }}
              />
            </ContentItem>
            <ContentItem>
              <Controller
                name="permanent"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={t("label.permanent")}
                  />
                )}
              />
              <FormHelperText>{t("help.permanent")}</FormHelperText>
            </ContentItem>
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
