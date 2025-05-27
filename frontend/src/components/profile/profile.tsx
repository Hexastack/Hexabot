/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CheckIcon from "@mui/icons-material/Check";
import EmailIcon from "@mui/icons-material/Email";
import KeyIcon from "@mui/icons-material/Key";
import LanguageIcon from "@mui/icons-material/Language";
import { Box, Button, Grid, MenuItem, Typography } from "@mui/material";
import { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "react-query";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Adornment } from "@/app-components/inputs/Adornment";
import AvatarInput from "@/app-components/inputs/AvatarInput";
import { Input } from "@/app-components/inputs/Input";
import { PasswordInput } from "@/app-components/inputs/PasswordInput";
import { useUpdateProfile } from "@/hooks/entities/auth-hooks";
import { CURRENT_USER_KEY } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { IProfileAttributes, IUser } from "@/types/user.types";
import { MIME_TYPES } from "@/utils/attachment";

type ProfileFormProps = { user: IUser };

export const ProfileForm: FC<ProfileFormProps> = ({ user }) => {
  const { t } = useTranslate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate: updateProfile, isLoading } = useUpdateProfile({
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: (data) => {
      queryClient.setQueryData([CURRENT_USER_KEY], data);
      toast.success(t("message.account_update_success"));
    },
  });
  const {
    watch,
    trigger,
    handleSubmit,
    control,
    formState: { errors },
    register,
    setValue,
  } = useForm<IProfileAttributes>({
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      language: user.language,
    },
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
    updateProfile({
      ...rest,
      password: password || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <Grid container gap={8} alignContent="center" justifyContent="center">
        <Grid item xs={4}>
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <>
                <Box sx={{ position: "relative" }}>
                  <AvatarInput
                    label={t("label.avatar")}
                    accept={MIME_TYPES["images"].join(",")}
                    size={256}
                    {...field}
                    onChange={(file) => setValue("avatar", file)}
                  />
                </Box>
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
        <Grid item xs={6} gap={2} container>
          <ContentContainer gap={2}>
            <ContentItem>
              <Input
                label={t("label.user_first_name")}
                {...register("first_name", validationRules.first_name)}
                autoFocus
                error={!!errors.first_name}
                helperText={
                  errors.first_name ? errors.first_name.message : null
                }
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.last_name")}
                {...register("last_name", validationRules.last_name)}
                error={!!errors.last_name}
                helperText={errors.last_name ? errors.last_name.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Input
                    label={t("label.language")}
                    error={!!errors.language}
                    helperText={
                      errors.language ? errors.language.message : null
                    }
                    select
                    InputProps={{
                      startAdornment: <Adornment Icon={LanguageIcon} />,
                    }}
                    {...field}
                  >
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Input>
                )}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.email")}
                {...register("email", validationRules.email)}
                required
                error={!!errors.email}
                helperText={errors.email ? errors.email.message : null}
                InputProps={{
                  startAdornment: <Adornment Icon={EmailIcon} />,
                }}
              />
            </ContentItem>
            <ContentItem>
              <PasswordInput
                label={t("label.password")}
                {...register("password", validationRules.password)}
                required
                error={!!errors.password}
                helperText={errors.password ? errors.password.message : null}
                InputProps={{
                  startAdornment: <Adornment Icon={KeyIcon} />,
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
                InputProps={{
                  startAdornment: <Adornment Icon={KeyIcon} />,
                }}
              />
            </ContentItem>
          </ContentContainer>
          <Grid container justifyContent="end">
            <Button
              variant="contained"
              type="submit"
              startIcon={<CheckIcon />}
              onClick={handleSubmit(onSubmitForm)}
              disabled={isLoading}
            >
              {t("button.save")}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};
