/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, MenuItem, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Check, Key, Languages, Mail } from "lucide-react";
import { FC, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Adornment } from "@/app-components/inputs/Adornment";
import AvatarInput from "@/app-components/inputs/AvatarInput";
import { PasswordInput } from "@/app-components/inputs/PasswordInput";
import { PasswordStrengthInput } from "@/app-components/inputs/PasswordStrengthInput";
import { useApiClientMutation } from "@/hooks/useApiClient";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { IProfileAttributes, IUser } from "@/types/user.types";
import { MIME_TYPES } from "@/utils/attachment";

type ProfileFormProps = { user: IUser };

export const ProfileForm: FC<ProfileFormProps> = ({ user }) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: updateProfile, isPending } = useApiClientMutation(
    "updateProfile",
    {
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        toast.success(t("message.account_update_success"));
      },
    },
  );
  const defaultValues = useMemo(
    () => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      language: user.language,
    }),
    [user],
  );
  const {
    watch,
    trigger,
    handleSubmit,
    control,
    formState: { errors },
    register,
    setValue,
    reset,
  } = useForm<IProfileAttributes>({
    defaultValues,
  });
  const rules = useValidationRules();
  const validationRules = {
    ...rules,
    email: {
      ...rules.email,
      required: t("message.email_is_required"),
    },
    password: {
      ...rules.password,
    },
    password2: {
      validate: (val?: string) => {
        if (val !== watch("password")) {
          trigger("password");

          return t("message.password_match");
        }
      },
    },
  };
  const onSubmitForm = ({
    password,
    password2: _password2,
    ...rest
  }: IProfileAttributes) => {
    updateProfile([
      user.id,
      {
        ...rest,
        password: password || undefined,
      },
    ]);
  };

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <Grid container gap={8} alignContent="center" justifyContent="center">
        <Grid width={256} size={4}>
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <>
                <AvatarInput
                  label={t("label.avatar")}
                  accept={MIME_TYPES["images"].join(",")}
                  size={256}
                  {...field}
                  onChange={(file) => setValue("avatar", file)}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem", fontStyle: "italic", mt: 2 }}
                >
                  {t("message.avatar_update")}
                </Typography>
              </>
            )}
          />
        </Grid>
        <Grid container flexDirection="column" size={6} gap={2}>
          <ContentContainer>
            <ContentItem>
              <TextField
                label={t("label.user_first_name")}
                {...register("firstName", validationRules.first_name)}
                autoFocus
                error={!!errors.firstName}
                helperText={errors.firstName ? errors.firstName.message : null}
              />
            </ContentItem>
            <ContentItem>
              <TextField
                label={t("label.last_name")}
                {...register("lastName", validationRules.last_name)}
                error={!!errors.lastName}
                helperText={errors.lastName ? errors.lastName.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <TextField
                    label={t("label.language")}
                    error={!!errors.language}
                    helperText={
                      errors.language ? errors.language.message : null
                    }
                    select
                    slotProps={{
                      input: {
                        startAdornment: <Adornment Icon={Languages} />,
                      },
                    }}
                    {...field}
                  >
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </TextField>
                )}
              />
            </ContentItem>
            <ContentItem>
              <TextField
                label={t("label.email")}
                {...register("email", validationRules.email)}
                required
                error={!!errors.email}
                helperText={errors.email ? errors.email.message : null}
                slotProps={{
                  input: {
                    startAdornment: <Adornment Icon={Mail} />,
                  },
                }}
              />
            </ContentItem>
            <ContentItem>
              <PasswordStrengthInput
                label={t("label.password")}
                {...register("password", validationRules.password)}
                required
                error={!!errors.password}
                helperText={errors.password ? errors.password.message : null}
                slotProps={{
                  input: {
                    startAdornment: <Adornment Icon={Key} />,
                  },
                }}
              />
            </ContentItem>
            <ContentItem>
              <PasswordInput
                label={t("placeholder.password2")}
                {...register("password2", validationRules.password2)}
                required
                error={!!errors.password2}
                helperText={errors.password2 ? errors.password2.message : null}
                slotProps={{
                  input: {
                    startAdornment: <Adornment Icon={Key} />,
                  },
                }}
              />
            </ContentItem>
          </ContentContainer>
          <Grid container justifyContent="end">
            <Button
              variant="contained"
              type="submit"
              startIcon={<Check />}
              onClick={handleSubmit(onSubmitForm)}
              disabled={isPending}
            >
              {t("button.save")}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};
