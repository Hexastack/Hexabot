/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Role } from "@hexabot-ai/types";
import { Button, Link, TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { User, IUserAttributes } from "@/types/user.types";

export const EditUserForm: FC<ComponentFormProps<User, Role[]>> = ({
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
            <TextField
              disabled
              label={t("label.full_name")}
              value={user?.fullName}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
            />
          </ContentItem>
          <ContentItem>
            <Grid container gap={3}>
              <Grid size="grow">
                <Controller
                  name="roles"
                  rules={validationRules.roles}
                  control={control}
                  defaultValue={roles?.map(({ id }) => id) || []}
                  render={({ field }) => {
                    const { onChange, ...rest } = field;

                    return (
                      <AutoCompleteEntitySelect<Role>
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
              <Grid size="auto" alignContent="end">
                <Link href="/roles">
                  <Button variant="contained" size="small">
                    {t("button.manage")}
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
