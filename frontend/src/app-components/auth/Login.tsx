/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import EmailIcon from "@mui/icons-material/Email";
import KeyIcon from "@mui/icons-material/Key";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Button, Grid, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useConfirmAccount, useLogin } from "@/hooks/entities/auth-hooks";
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
  const router = useRouter();
  const { authenticate } = useAuth();
  const { mutate: login, isLoading } = useLogin({
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
    const queryToken = router.query.token;

    if (queryToken)
      confirmAccount({
        token: String(queryToken),
      });
  }, [router.query.token]);

  return (
    <PublicContentWrapper>
      <Paper sx={{ width: { xs: "100%", md: "33%" }, p: 2 }}>
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <ContentContainer gap={2}>
            <Typography variant="h1" fontSize="19px" fontWeight={700}>
              {t("title.login")}
            </Typography>
            <Input
              label={t("placeholder.email")}
              error={!!errors.identifier}
              required
              autoFocus
              InputProps={{
                startAdornment: <Adornment Icon={EmailIcon} />,
              }}
              helperText={errors.identifier ? errors.identifier.message : null}
              {...register("identifier", validationRules.email)}
            />

            <PasswordInput
              label={t("label.password")}
              error={!!errors.password}
              required
              InputProps={{
                startAdornment: <Adornment Icon={KeyIcon} />,
              }}
              helperText={errors.password ? errors.password.message : null}
              {...register("password", validationRules.password)}
            />
            <Grid container gap={2} justifyContent="space-between">
              <Grid alignContent="center">
                <Link href="/reset">
                  <Button variant="text" sx={{ textDecoration: "underline" }}>
                    {t("link.reset")}
                  </Button>
                </Link>
              </Grid>
              <Grid>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  endIcon={<KeyboardArrowRightIcon />}
                  onClick={handleSubmit(onSubmitForm)}
                  disabled={isLoading}
                >
                  {t("button.login")}
                </Button>
              </Grid>
            </Grid>
          </ContentContainer>
        </form>
      </Paper>
    </PublicContentWrapper>
  );
};
