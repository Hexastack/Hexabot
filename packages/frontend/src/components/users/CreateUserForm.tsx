/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Role } from "@hexabot-ai/types";
import { Button, Link, TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import { FC, Fragment } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { PasswordInput } from "@/app-components/inputs/PasswordInput";
import { PasswordStrengthInput } from "@/app-components/inputs/PasswordStrengthInput";
import { useCreate } from "@/hooks/crud/useCreate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";

type CreateUserFormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  password2: string;
  roles: string[];
};

const DEFAULT_VALUES: CreateUserFormData = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  password2: "",
  roles: [],
};

export const CreateUserForm: FC<ComponentFormProps<undefined>> = ({
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  const rules = useValidationRules();
  const { mutate: createUser, isPending } = useCreate(EntityType.USER, {
    onError: (error: Error & { statusCode?: number }) => {
      if (error.statusCode === 403) {
        void refetchUser();
      }
      rest.onError?.();
      toast.error(error);
    },
    onSuccess() {
      void refetchUser();
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  });
  const {
    control,
    register,
    watch,
    trigger,
    formState: { errors },
    handleSubmit,
  } = useForm<CreateUserFormData>({
    defaultValues: DEFAULT_VALUES,
  });
  const validationRules = {
    first_name: {
      required: t("message.first_name_is_required"),
    },
    last_name: {
      required: t("message.last_name_is_required"),
    },
    username: {
      required: t("message.username_is_required"),
    },
    email: {
      ...rules.email,
      required: t("message.email_is_required"),
    },
    roles: {
      validate: (value?: string[]) =>
        (Array.isArray(value) && value.length > 0) ||
        t("message.roles_is_required"),
    },
    password: {
      ...rules.password,
      required: t("message.password_is_required"),
    },
    password2: {
      validate: (value?: string) => {
        if (value !== watch("password")) {
          trigger("password");

          return t("message.password_match");
        }
      },
    },
  };
  const onSubmitForm = ({
    password2: _password2,
    ...params
  }: CreateUserFormData) => {
    createUser({
      ...params,
      avatar: null,
      state: false,
    } as any);
  };

  return (
    <Wrapper
      onSubmit={handleSubmit(onSubmitForm)}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled: isPending,
      }}
    >
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <TextField
              label={t("placeholder.first_name")}
              error={!!errors.firstName}
              required
              autoFocus
              {...register("firstName", validationRules.first_name)}
              helperText={errors.firstName ? errors.firstName.message : null}
            />
          </ContentItem>
          <ContentItem>
            <TextField
              label={t("placeholder.last_name")}
              error={!!errors.lastName}
              required
              {...register("lastName", validationRules.last_name)}
              helperText={errors.lastName ? errors.lastName.message : null}
            />
          </ContentItem>
          <ContentItem>
            <TextField
              label={t("placeholder.username")}
              error={!!errors.username}
              required
              {...register("username", validationRules.username)}
              helperText={errors.username ? errors.username.message : null}
            />
          </ContentItem>
          <ContentItem>
            <TextField
              label={t("placeholder.email")}
              error={!!errors.email}
              required
              {...register("email", validationRules.email)}
              helperText={errors.email ? errors.email.message : null}
            />
          </ContentItem>
          <ContentItem>
            <PasswordStrengthInput
              label={t("label.password")}
              error={!!errors.password}
              required
              {...register("password", validationRules.password)}
              helperText={errors.password ? errors.password.message : null}
            />
          </ContentItem>
          <ContentItem>
            <PasswordInput
              label={t("placeholder.password2")}
              error={!!errors.password2}
              required
              {...register("password2", validationRules.password2)}
              helperText={errors.password2 ? errors.password2.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Grid container gap={3}>
              <Grid size="grow">
                <Controller
                  name="roles"
                  rules={validationRules.roles}
                  control={control}
                  render={({ field }) => {
                    const { onChange, ...rest } = field;

                    return (
                      <AutoCompleteEntitySelect<Role>
                        searchFields={["name"]}
                        entity={EntityType.ROLE}
                        format={Format.BASIC}
                        labelKey="name"
                        label={t("label.roles")}
                        multiple={true}
                        {...field}
                        error={!!errors.roles}
                        helperText={errors.roles ? errors.roles.message : null}
                        onChange={(_event, selected) =>
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
