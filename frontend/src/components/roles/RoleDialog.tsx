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
import { IRole, IRoleAttributes } from "@/types/role.types";

export type RoleDialogProps = DialogControlProps<IRole>;
export const RoleDialog: FC<RoleDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutateAsync: createRole } = useCreate(EntityType.ROLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: updateRole } = useUpdate(EntityType.ROLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<IRoleAttributes>({
    defaultValues: { name: "" },
  });
  const validationRules = {
    name: {
      required: t("message.name_is_required"),
    },
  };
  const onSubmitForm = async (params: IRoleAttributes) => {
    if (data) {
      updateRole({ id: data.id, params });
    } else {
      createRole(params);
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
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
          {data ? t("title.edit_role") : t("title.new_role")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("placeholder.name")}
                error={!!errors.name}
                required
                autoFocus
                helperText={errors.name ? errors.name.message : null}
                {...register("name", validationRules.name)}
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
