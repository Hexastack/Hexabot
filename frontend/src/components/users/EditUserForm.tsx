/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Button, Grid, Link } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Input } from "@/app-components/inputs/Input";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IRole } from "@/types/role.types";
import { IUser, IUserAttributes } from "@/types/user.types";

const getFullName = (user?: IUser) => `${user?.first_name} ${user?.last_name}`;

export const EditUserForm: FC<ComponentFormProps<IUser, IRole[]>> = ({
  data: { defaultValues: user, presetValues: roles },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: updateUser } = useUpdate(EntityType.USER, {
    onError: (error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  });
  const {
    reset,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<IUserAttributes>({
    defaultValues: { roles: roles?.map((role) => role.id) },
  });
  const validationRules = {
    roles: {
      required: t("message.roles_is_required"),
    },
  };
  const onSubmitForm = (params: IUserAttributes) => {
    if (user?.id) {
      updateUser({
        id: user.id,
        params,
      });
    }
  };

  useEffect(() => {
    if (user) {
      reset({ roles: user.roles });
    }
  }, [reset, user]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              disabled
              label={t("label.full_name")}
              value={user ? getFullName(user) : undefined}
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
                  defaultValue={roles?.map(({ id }) => id) || []}
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
                        helperText={errors.roles ? errors.roles.message : null}
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
      </form>
    </Wrapper>
  );
};
