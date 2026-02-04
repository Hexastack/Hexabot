/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, FormControl, FormLabel, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  ChevronRight as KeyboardArrowRightIcon,
  Key as KeyIcon,
  Repeat2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";

import { useResetPassword } from "@/hooks/entities/reset-hooks";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";

import { PublicContentWrapper } from "../../components/anonymous/PublicContentWrapper";
import { ContentContainer } from "../dialogs";
import { Adornment } from "../inputs/Adornment";
import { PasswordInput } from "../inputs/PasswordInput";

export const ResetPassword = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const rules = useValidationRules();
  const validationRules = {
    password: {
      ...rules.password,
      required: t("message.password_is_required"),
    },
    password2: {
      ...rules.password2,
      required: t("message.password_is_required"),
    },
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ password: string; password2: string }>({
    defaultValues: { password: "", password2: "" },
  });
  const { query, replace } = useAppRouter();
  const queryToken = Array.isArray(query.token)
    ? query.token.at(-1)
    : query.token;
  const { mutate: resetPassword } = useResetPassword(queryToken || "", {
    onSuccess: () => {
      toast.success(t("message.reset_newpass_success"));
      replace("/login");
    },
    onError: () => {
      toast.error(t("message.server_error"));
    },
  });

  return (
    <PublicContentWrapper>
      <form
        onSubmit={handleSubmit((payload) => {
          resetPassword(payload);
        })}
      >
        <ContentContainer>
          <Grid gap={1} mb={1} display="flex" alignItems="center">
            <Repeat2 />
            <Typography variant="h4" fontWeight={700}>
              {t("title.reset_password")}
            </Typography>
          </Grid>
          <FormControl error={!!errors.password}>
            <FormLabel htmlFor="password">{t("label.password")}</FormLabel>
            <PasswordInput
              id="password"
              autoFocus
              error={!!errors.password}
              required
              slotProps={{
                input: {
                  startAdornment: <Adornment Icon={KeyIcon} />,
                },
              }}
              helperText={errors.password ? errors.password.message : null}
              {...register("password", validationRules.password)}
            />
          </FormControl>
          <FormControl error={!!errors.password2}>
            <FormLabel htmlFor="password2">
              {t("placeholder.password2")}
            </FormLabel>
            <PasswordInput
              id="password2"
              error={!!errors.password2}
              required
              slotProps={{
                input: {
                  startAdornment: <Adornment Icon={KeyIcon} />,
                },
              }}
              helperText={errors.password2 ? errors.password2.message : null}
              {...register("password2", validationRules.password2)}
            />
          </FormControl>
          <Grid container direction="column" gap={1} mt={2}>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              endIcon={<KeyboardArrowRightIcon size={14} />}
            >
              {t("button.submit")}
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined">
              {t("button.cancel")}
            </Button>
          </Grid>
        </ContentContainer>
      </form>
    </PublicContentWrapper>
  );
};
