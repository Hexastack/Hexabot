/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Button,
  FormControl,
  FormLabel,
  Grid,
  Typography,
} from "@mui/material";
import {
  Mail as EmailIcon,
  ChevronRight as KeyboardArrowRightIcon,
  Key as KeyIcon,
  LogIn,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";

import { useConfirmAccount, useLogin } from "@/hooks/entities/auth-hooks";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { ILoginAttributes } from "@/types/auth/login.types";

import { PublicContentWrapper } from "../../components/anonymous/PublicContentWrapper";
import { ContentContainer } from "../dialogs/layouts/ContentContainer";
import { Adornment } from "../inputs/Adornment";
import { Input } from "../inputs/Input";
import { PasswordInput } from "../inputs/PasswordInput";

const DEFAULT_VALUES: ILoginAttributes = {
  identifier: "",
  password: "",
};

export const Login = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const router = useAppRouter();
  const { authenticate } = useAuth();
  const { mutate: login, isPending } = useLogin({
    onSuccess: (data) => {
      if (data.state) authenticate(data);
      else {
        toast.error(t("message.account_disabled"));
      }
    },
    onError() {
      toast.error(t("message.login_failure"));
    },
  });
  const { mutate: confirmAccount } = useConfirmAccount({
    onSuccess: () => {
      toast.success(t("message.reset_confirm_success"));
    },
    onError: () => {
      //TODO: need to enhance the error
      toast.error(t("message.account_disabled"));
    },
  });
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<ILoginAttributes>({
    defaultValues: DEFAULT_VALUES,
  });
  const rules = useValidationRules();
  const validationRules = {
    email: {
      ...rules.email,
      required: t("message.email_is_required"),
    },
    password: {
      ...rules.password,
      required: t("message.password_is_required"),
    },
  };
  const onSubmitForm = (data: ILoginAttributes) => {
    login(data);
  };

  useEffect(() => {
    const rawToken = router.query.token;
    const queryToken = Array.isArray(rawToken) ? rawToken.at(-1) : rawToken;

    if (queryToken) {
      confirmAccount({
        token: String(queryToken),
      });
    }
  }, [confirmAccount, router.query.token]);

  return (
    <PublicContentWrapper>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <Grid gap={1} mb={1} display="flex" alignItems="center">
            <LogIn />
            <Typography variant="h4">{t("title.login")}</Typography>
          </Grid>
          <FormControl error={!!errors.identifier}>
            <FormLabel htmlFor="email">{t("placeholder.email")}</FormLabel>
            <Input
              id="email"
              error={!!errors.identifier}
              required
              autoFocus
              slotProps={{
                input: {
                  startAdornment: <Adornment Icon={EmailIcon} />,
                },
              }}
              helperText={errors.identifier ? errors.identifier.message : null}
              {...register("identifier", validationRules.email)}
            />
          </FormControl>
          <FormControl error={!!errors.password}>
            <FormLabel htmlFor="password">{t("label.password")}</FormLabel>
            <PasswordInput
              id="password"
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
          <Grid container direction="column" gap={1} mt={2}>
            <Grid>
              <Button
                fullWidth
                color="primary"
                variant="contained"
                type="submit"
                endIcon={<KeyboardArrowRightIcon size={14} />}
                onClick={handleSubmit(onSubmitForm)}
                disabled={isPending}
              >
                {t("button.login")}
              </Button>
            </Grid>
            <Grid textAlign="center">
              <Button
                component={RouterLink}
                to="/reset"
                variant="text"
                sx={{ textDecoration: "underline" }}
              >
                {t("link.reset")}
              </Button>
            </Grid>
          </Grid>
        </ContentContainer>
      </form>
    </PublicContentWrapper>
  );
};
