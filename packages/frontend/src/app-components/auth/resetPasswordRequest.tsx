/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Button, FormControl, FormLabel, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Mail as EmailIcon,
  ChevronRight as KeyboardArrowRightIcon,
  SendHorizontal,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";

import { useRequestResetPassword } from "@/hooks/entities/reset-hooks";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";

import { PublicContentWrapper } from "../../components/anonymous/PublicContentWrapper";
import { ContentContainer } from "../dialogs";
import { Adornment } from "../inputs/Adornment";
import { Input } from "../inputs/Input";

export const ResetPasswordRequest = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });
  const { mutate: requestReset } = useRequestResetPassword({
    onSuccess: () => {
      toast.success(t("message.reset_success"));
    },
    onError: () => {
      toast.error(t("message.server_error"));
    },
  });

  return (
    <PublicContentWrapper>
      <form
        id="resetPasswordForm"
        onSubmit={handleSubmit((payload) => {
          requestReset(payload);
        })}
      >
        <ContentContainer gap={2}>
          <Grid gap={1} mb={1} display="flex" alignItems="center">
            <SendHorizontal />
            <Typography variant="h4">{t("title.reset_password")}</Typography>
          </Grid>
          <FormControl error={!!errors.email}>
            <FormLabel htmlFor="email">{t("label.email")}</FormLabel>
            <Input
              id="email"
              error={!!errors.email}
              required
              autoFocus
              slotProps={{
                input: {
                  startAdornment: <Adornment Icon={EmailIcon} />,
                },
              }}
              helperText={errors.email ? errors.email.message : null}
              {...register("email", {
                required: t("message.email_is_required"),
              })}
            />
          </FormControl>
          <Grid container direction="column" gap={1} mt={2}>
            <Button
              variant="contained"
              form="resetPasswordForm"
              type="submit"
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
