/*
 * Copyright © 2025 Hexastack. All rights reserved.
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
import {
  IContentType,
  IContentTypeAttributes,
} from "@/types/content-type.types";

export type ContentTypeDialogProps = DialogControlProps<IContentType>;
export const ContentTypeDialog: FC<ContentTypeDialogProps> = ({
  open,
  datum: contentType,
  closeDialog,
}) => {
  const { toast } = useToast();
  const { t } = useTranslate();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<IContentTypeAttributes>({
    defaultValues: { name: contentType?.name || "" },
  });
  const CloseAndReset = () => {
    closeDialog();
    reset();
  };
  const { mutateAsync: createContentType } = useCreate(
    EntityType.CONTENT_TYPE,
    {
      onError: (error) => {
        toast.error(error);
      },
      onSuccess: () => {
        closeDialog();
        toast.success(t("message.success_save"));
      },
    },
  );
  const { mutateAsync: updateContentType } = useUpdate(
    EntityType.CONTENT_TYPE,
    {
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        closeDialog();
        toast.success(t("message.success_save"));
      },
    },
  );
  const validationRules = {
    name: {
      required: t("message.name_is_required"),
    },
  };
  const onSubmitForm = async (params: IContentTypeAttributes) => {
    if (contentType) {
      updateContentType({
        id: contentType.id,
        params,
      });
    } else {
      createContentType(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (contentType) {
      reset({
        name: contentType.name,
      });
    } else {
      reset();
    }
  }, [contentType, reset]);

  return (
    <Dialog open={open} fullWidth onClose={CloseAndReset}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={CloseAndReset}>
          {contentType
            ? t("title.edit_content_type")
            : t("title.new_content_type")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("label.name")}
                error={!!errors.name}
                {...register("name", validationRules.name)}
                helperText={errors.name ? errors.name.message : null}
                required
                autoFocus
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
