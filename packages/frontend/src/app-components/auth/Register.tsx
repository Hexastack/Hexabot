/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Type as AbcIcon,
  ClipboardPenLine,
  ChevronRight as KeyboardArrowRightIcon,
  Key as KeyIcon,
  Mail as MarkunreadIcon,
  User as PersonIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAcceptInvite } from "@/hooks/entities/auth-hooks";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { useValidationRules } from "@/hooks/useValidationRules";
import { Title } from "@/layout/content/Title";
import { IRegisterAttributes } from "@/types/auth/register.types";
import { JWT } from "@/utils/Jwt";

import { PublicContentWrapper } from "../../components/anonymous/PublicContentWrapper";
import { ContentContainer } from "../dialogs/layouts/ContentContainer";
import { Adornment } from "../inputs/Adornment";
import { PasswordInput } from "../inputs/PasswordInput";

const DEFAULT_VALUES: IRegisterAttributes = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
  username: "",
  roles: [],
  token: "",
};

type TRegisterExtendedPayload = IRegisterAttributes & { password2: string };

export const Register = () => {
  const { t } = useTranslate();
  const router = useAppRouter();
  const { toast } = useToast();
  const { mutate: acceptInvite, isPending } = useAcceptInvite({
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
    const rawToken = router.query.token;
    const queryToken = Array.isArray(rawToken) ? rawToken.at(-1) : rawToken;

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
  }, [router.query.token, setValue, toast]);

  return (
    <PublicContentWrapper>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <Title title={t("title.register")} Icon={ClipboardPenLine} />
          <TextField
            label={t("placeholder.first_name")}
            error={!!errors.firstName}
            required
            autoFocus
            {...register("firstName", validationRules.first_name)}
            slotProps={{
              input: {
                startAdornment: <Adornment Icon={AbcIcon} />,
              },
            }}
            helperText={errors.firstName ? errors.firstName.message : null}
          />
          <TextField
            label={t("placeholder.last_name")}
            error={!!errors.lastName}
            required
            {...register("lastName", validationRules.last_name)}
            slotProps={{
              input: {
                startAdornment: <Adornment Icon={AbcIcon} />,
              },
            }}
            helperText={errors.lastName ? errors.lastName.message : null}
          />
          <TextField
            label={t("placeholder.username")}
            error={!!errors.username}
            required
            {...register("username", validationRules.username)}
            slotProps={{
              input: {
                startAdornment: <Adornment Icon={PersonIcon} />,
              },
            }}
            helperText={errors.username ? errors.username.message : null}
          />
          <TextField
            label={t("placeholder.email")}
            error={!!errors.email}
            required
            {...register("email", validationRules.email)}
            helperText={errors.email ? errors.email.message : null}
            slotProps={{
              input: {
                disabled: readonlyEmail,
                readOnly: readonlyEmail,
                startAdornment: <Adornment Icon={MarkunreadIcon} />,
              },
            }}
          />
          <PasswordInput
            label={t("label.password")}
            error={!!errors.password}
            required
            {...register("password", validationRules.password)}
            helperText={errors.password ? errors.password.message : null}
            slotProps={{
              input: {
                startAdornment: <Adornment Icon={KeyIcon} />,
              },
            }}
          />
          <PasswordInput
            label={t("placeholder.password2")}
            error={!!errors.password2}
            required
            {...register("password2", validationRules.password2)}
            helperText={errors.password2 ? errors.password2.message : null}
            slotProps={{
              input: {
                startAdornment: <Adornment Icon={KeyIcon} />,
              },
            }}
          />
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
          <Grid container gap={1} justifyContent="end">
            <Grid>
              <Button
                type="submit"
                variant="contained"
                endIcon={<KeyboardArrowRightIcon size={14} />}
                onClick={handleSubmit(onSubmitForm)}
                disabled={isPending || !isTermsAccepted}
              >
                {t("button.register")}
              </Button>
            </Grid>
          </Grid>
        </ContentContainer>
      </form>
    </PublicContentWrapper>
  );
};
