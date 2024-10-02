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
import { ILanguage, ILanguageAttributes } from "@/types/language.types";

export type LanguageDialogProps = DialogControlProps<ILanguage>;
export const LanguageDialog: FC<LanguageDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutateAsync: createLanguage } = useCreate(EntityType.LANGUAGE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: updateLanguage } = useUpdate(EntityType.LANGUAGE, {
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
    formState: { errors },
    handleSubmit,
    control,
  } = useForm<ILanguageAttributes>({
    defaultValues: {
      title: data?.title || "",
      code: data?.code || "",
      isRTL: data?.isRTL || false,
    },
  });
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    code: {
      required: t("message.code_is_required"),
    },
  };
  const onSubmitForm = async (params: ILanguageAttributes) => {
    if (data) {
      updateLanguage({ id: data.id, params });
    } else {
      createLanguage(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        title: data.title,
        code: data.code,
        isRTL: data.isRTL,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {data ? t("title.edit_label") : t("title.new_label")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("label.title")}
                error={!!errors.title}
                {...register("title", validationRules.title)}
                helperText={errors.title ? errors.title.message : null}
                multiline={true}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.code")}
                error={!!errors.code}
                {...register("code", validationRules.code)}
                helperText={errors.code ? errors.code.message : null}
                multiline={true}
              />
            </ContentItem>
            <ContentItem>
              <Controller
                name="isRTL"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={t("label.is_rtl")}
                  />
                )}
              />
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
