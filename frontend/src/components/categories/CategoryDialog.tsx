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
import { ICategory, ICategoryAttributes } from "@/types/category.types";

export type CategoryDialogProps = DialogControlProps<ICategory>;

export const CategoryDialog: FC<CategoryDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutateAsync: createCategory } = useCreate(EntityType.CATEGORY, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess: () => {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: updateCategory } = useUpdate(EntityType.CATEGORY, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<ICategoryAttributes>({
    defaultValues: { label: data?.label || "" },
  });
  const validationRules = {
    label: {
      required: t("message.label_is_required"),
    },
  };
  const onSubmitForm = async (params: ICategoryAttributes) => {
    if (data) {
      updateCategory({ id: data.id, params });
    } else {
      createCategory(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        label: data.label,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {data ? t("title.edit_category") : t("title.new_category")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("placeholder.label")}
                {...register("label", validationRules.label)}
                autoFocus
                helperText={errors.label ? errors.label.message : null}
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
