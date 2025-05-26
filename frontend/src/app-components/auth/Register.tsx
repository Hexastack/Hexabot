/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AbcIcon from "@mui/icons-material/Abc";
import KeyIcon from "@mui/icons-material/Key";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MarkunreadIcon from "@mui/icons-material/Markunread";
import PersonIcon from "@mui/icons-material/Person";
import {
  Button,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAcceptInvite } from "@/hooks/entities/auth-hooks";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { IRegisterAttributes } from "@/types/auth/register.types";
import { JWT } from "@/utils/Jwt";

import { PublicContentWrapper } from "../../components/anonymous/PublicContentWrapper";
import { ContentContainer } from "../dialogs/layouts/ContentContainer";
import { ContentItem } from "../dialogs/layouts/ContentItem";
import { Adornment } from "../inputs/Adornment";
import { Input } from "../inputs/Input";
import { PasswordInput } from "../inputs/PasswordInput";

const DEFAULT_VALUES: IRegisterAttributes = {
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  username: "",
  roles: [],
  token: "",
};

type TRegisterExtendedPayload = IRegisterAttributes & { password2: string };

export const Register = () => {
  const { t } = useTranslate();
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: acceptInvite, isLoading } = useAcceptInvite({
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_invitation_sent"));
      router.push("/login");
    },
  });
  const {
    watch,
    trigger,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<TRegisterExtendedPayload>({
    defaultValues: DEFAULT_VALUES,
  });
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false);
  const [readonlyEmail, setReadonlyEmail] = useState<boolean>(false);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsTermsAccepted(event.target.checked);
  };
  const rules = useValidationRules();
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
    roles: {},
    token: {},
    password: {
      ...rules.password,
      required: t("message.password_is_required"),
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
    password2: _password2,
    ...rest
  }: TRegisterExtendedPayload) => {
    acceptInvite(rest);
  };

  useEffect(() => {
    const queryToken = router.query.token;

    if (queryToken) {
      const jwt = new JWT();
      const decodedToken = jwt.decode(String(queryToken));

      if (jwt.isExpired(decodedToken)) {
        toast.error("Invalid Token");
      } else {
        setValue("token", String(queryToken));

        // (decodedToken);
        setValue("email", decodedToken.email);
        if (decodedToken.roles.length) setValue("roles", decodedToken.roles);

        setReadonlyEmail(!!decodedToken?.email);
      }
    }
  }, [router.query.token]);

  return (
    <PublicContentWrapper>
      <Paper
        sx={{
          width: { xs: "100%", md: "33%" },
          p: 2,
        }}
      >
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <ContentContainer>
            <ContentItem>
              <Typography variant="h1" fontSize="19px" fontWeight={700}>
                {t("title.register")}
              </Typography>
            </ContentItem>
            <ContentItem>
              <Input
                label={t("placeholder.first_name")}
                error={!!errors.first_name}
                required
                autoFocus
                {...register("first_name", validationRules.first_name)}
                InputProps={{
                  startAdornment: <Adornment Icon={AbcIcon} />,
                }}
                helperText={
                  errors.first_name ? errors.first_name.message : null
                }
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("placeholder.last_name")}
                error={!!errors.last_name}
                required
                {...register("last_name", validationRules.last_name)}
                InputProps={{
                  startAdornment: <Adornment Icon={AbcIcon} />,
                }}
                helperText={errors.last_name ? errors.last_name.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("placeholder.username")}
                error={!!errors.username}
                required
                {...register("username", validationRules.username)}
                InputProps={{
                  startAdornment: <Adornment Icon={PersonIcon} />,
                }}
                helperText={errors.username ? errors.username.message : null}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("placeholder.email")}
                error={!!errors.email}
                required
                {...register("email", validationRules.email)}
                helperText={errors.email ? errors.email.message : null}
                InputProps={{
                  disabled: readonlyEmail,
                  readOnly: readonlyEmail,
                  startAdornment: <Adornment Icon={MarkunreadIcon} />,
                }}
              />
            </ContentItem>
            <ContentItem>
              <PasswordInput
                label={t("label.password")}
                error={!!errors.password}
                required
                {...register("password", validationRules.password)}
                helperText={errors.password ? errors.password.message : null}
                InputProps={{
                  startAdornment: <Adornment Icon={KeyIcon} />,
                }}
              />
            </ContentItem>
            <ContentItem>
              <PasswordInput
                label={t("placeholder.password2")}
                error={!!errors.password2}
                required
                {...register("password2", validationRules.password2)}
                helperText={errors.password2 ? errors.password2.message : null}
                InputProps={{
                  startAdornment: <Adornment Icon={KeyIcon} />,
                }}
              />
            </ContentItem>
            <ContentItem>
              <FormControlLabel
                control={
                  <Switch checked={isTermsAccepted} onChange={handleChange} />
                }
                label={
                  <Typography
                    color={isTermsAccepted ? "primary.main" : "text.primary"}
                    fontSize="14px"
                  >
                    {t("label.terms")}
                  </Typography>
                }
              />
            </ContentItem>
            <ContentItem>
              <Grid container gap={1} justifyContent="end">
                <Grid>
                  <Button
                    type="submit"
                    endIcon={<KeyboardArrowRightIcon />}
                    onClick={handleSubmit(onSubmitForm)}
                    disabled={isLoading || !isTermsAccepted}
                  >
                    {t("button.register")}
                  </Button>
                </Grid>
              </Grid>
            </ContentItem>
          </ContentContainer>
        </form>
      </Paper>
    </PublicContentWrapper>
  );
};
