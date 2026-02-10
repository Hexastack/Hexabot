/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { enqueueSnackbar, OptionsObject } from "notistack";
import { useTranslation } from "react-i18next";

export const useToast = () => {
  const { t } = useTranslation();
  const extractErrorMessage = (error: any) => {
    if (typeof error === "string") {
      return error;
    } else if (error?.statusCode == 409) {
      return t("message.duplicate_error");
    } else if (Array.isArray(error?.message)) {
      return error?.message.toString();
    }

    return error?.message || t("message.internal_server_error");
  };

  return {
    toast: {
      error: (error: any, options?: OptionsObject<"error">) => {
        enqueueSnackbar(extractErrorMessage(error), {
          variant: "error",
          ...options,
        });
      },
      success: (message: string, options?: OptionsObject<"success">) =>
        enqueueSnackbar(message, {
          variant: "success",
          ...options,
        }),
      warning: (message: string, options?: OptionsObject<"warning">) =>
        enqueueSnackbar(message, {
          variant: "warning",
          ...options,
        }),
      info: (message: string, options?: OptionsObject<"info">) =>
        enqueueSnackbar(message, {
          variant: "info",
          ...options,
        }),
    },
  };
};
