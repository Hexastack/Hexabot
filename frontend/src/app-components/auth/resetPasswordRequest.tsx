/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Button, Grid, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useRequestResetPassword } from "@/hooks/entities/reset-hooks";
import { useToast } from "@/hooks/useToast";

import { ContentContainer } from "../dialogs";
import { Input } from "../inputs/Input";

export const ResetPasswordRequest = () => {
  const { t } = useTranslation();
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
    <Grid container justifyContent="center">
      <Paper sx={{ width: { xs: "100%", md: "33%" }, p: 2 }}>
        <form
          id="resetPasswordForm"
          onSubmit={handleSubmit((payload) => {
            requestReset(payload);
          })}
        >
          <ContentContainer gap={2}>
            <Typography variant="h1" fontSize="19px" fontWeight={700}>
              {t("title.reset_password")}
            </Typography>
            <Input
              label={t("label.email")}
              error={!!errors.email}
              required
              autoFocus
              {...register("email", {
                required: t("message.email_is_required"),
              })}
              helperText={errors.email ? errors.email.message : null}
            />
            <Grid container gap={1} justifyContent="flex-end">
              <Button
                variant="contained"
                form="resetPasswordForm"
                type="submit"
              >
                {t("button.submit")}
              </Button>
              <Link href="/login">
                <Button variant="outlined">{t("button.cancel")}</Button>
              </Link>
            </Grid>
          </ContentContainer>
        </form>
      </Paper>
    </Grid>
  );
};
