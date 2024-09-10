/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
} from "@mui/material";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { EntityType, Format } from "@/services/types";
import { IRole } from "@/types/role.types";
import { IUser, IUserAttributes } from "@/types/user.types";

const getFullName = (val: IUser) => `${val.first_name} ${val.last_name}`;

export type EditUserDialogProps = DialogControlProps<{
  user: IUser;
  roles: IRole[];
}>;

export const EditUserDialog: FC<EditUserDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [fullName, setFullName] = useState<string>("");
  const { mutateAsync: updateUser } = useUpdate(EntityType.USER, {
    onError: (error) => {
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IUserAttributes>({
    defaultValues: { roles: data?.roles.map((role) => role.id) },
  });
  const validationRules = {
    roles: {
      required: t("message.roles_is_required"),
    },
  };
  const onSubmitForm = async (params: IUserAttributes) => {
    if (data?.user.id)
      updateUser({
        id: data.user.id,
        params,
      });
  };

  useEffect(() => {
    if (data?.user) setFullName(getFullName(data?.user));

    if (open) reset({ roles: data?.user?.roles });
  }, [open, reset, data]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {t("title.manage_roles")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                disabled
                label={t("label.auth_user")}
                value={fullName}
                InputProps={{
                  readOnly: true,
                }}
              />
            </ContentItem>
            <ContentItem>
              <Grid container gap={3}>
                <Grid item xs>
                  <Controller
                    name="roles"
                    rules={validationRules.roles}
                    control={control}
                    defaultValue={data?.roles?.map(({ id }) => id) || []}
                    render={({ field }) => {
                      const { onChange, ...rest } = field;

                      return (
                        <AutoCompleteEntitySelect<IRole>
                          autoFocus
                          searchFields={["name"]}
                          entity={EntityType.ROLE}
                          format={Format.BASIC}
                          labelKey="name"
                          label={t("label.roles")}
                          multiple={true}
                          {...field}
                          error={!!errors.roles}
                          helperText={
                            errors.roles ? errors.roles.message : null
                          }
                          onChange={(_e, selected) =>
                            onChange(selected.map(({ id }) => id))
                          }
                          {...rest}
                        />
                      );
                    }}
                  />
                </Grid>
                <Grid alignContent="center">
                  <Link href="/roles">
                    <Button variant="contained">{t("button.manage")}</Button>
                  </Link>
                </Grid>
              </Grid>
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
