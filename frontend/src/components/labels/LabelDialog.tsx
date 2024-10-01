/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Dialog, DialogActions, DialogContent } from "@mui/material";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";


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
import { ILabel, ILabelAttributes } from "@/types/label.types";
import { slugify } from "@/utils/string";

export type LabelDialogProps = DialogControlProps<ILabel>;
export const LabelDialog: FC<LabelDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutateAsync: createLabel } = useCreate(EntityType.LABEL, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: updateLabel } = useUpdate(EntityType.LABEL, {
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
    formState: { errors },
    handleSubmit,
  } = useForm<ILabelAttributes>({
    defaultValues: {
      name: data?.name || "",
      title: data?.title || "",
      description: data?.description || "",
    },
  });
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    name: {},
    description: {},
  };
  const onSubmitForm = async (params: ILabelAttributes) => {
    if (data) {
      updateLabel({ id: data.id, params });
    } else {
      createLabel(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        title: data.title,
        description: data.description,
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
                label={t("placeholder.title")}
                error={!!errors.title}
                required
                autoFocus
                {...register("title", validationRules.title)}
                InputProps={{
                  onChange: ({ target: { value } }) => {
                    setValue("title", value);
                    setValue("name", slugify(value).toUpperCase());
                  },
                }}
                helperText={errors.title ? errors.title.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Input
                placeholder={t("placeholder.name")}
                error={!!errors.name}
                {...register("name", validationRules.name)}
                disabled
                helperText={errors.name ? errors.name.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.description")}
                error={!!errors.description}
                {...register("description", validationRules.description)}
                helperText={
                  errors.description ? errors.description.message : null
                }
                multiline={true}
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
