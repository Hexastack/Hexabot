/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  enqueueSnackbar,
  OptionsObject,
  SnackbarProvider as ToastProvider,
} from "notistack";
import { useTranslation } from "react-i18next";

export { ToastProvider };

const TOAST_COMMON_STYLE = {
  border: "1px solid",
  fontWeight: "500",
  borderRadius: "36px",
  display: "grid",
  gridTemplateColumns: "auto 50px",
};
const TOAST_ERROR_STYLE = {
  ...TOAST_COMMON_STYLE,
  color: "#f56c6c",
  borderColor: "#fde2e2",
  backgroundColor: "#fef0f0",
};
const TOAST_SUCCESS_STYLE = {
  ...TOAST_COMMON_STYLE,
  color: "#67c23a",
  borderColor: "#e1f3d8",
  backgroundColor: "#f0f9eb",
};
const TOAST_WARNING_STYLE = {
  ...TOAST_COMMON_STYLE,
  color: "#e6a23c",
  borderColor: "#faecd8",
  backgroundColor: "#fdf6ec",
};

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
        const errorMessage = extractErrorMessage(error);

        enqueueSnackbar(errorMessage, {
          variant: "error",
          ...options,
          style: { ...TOAST_ERROR_STYLE, ...options?.style },
        });
      },
      success: (message: string, options?: OptionsObject<"success">) =>
        enqueueSnackbar(message, {
          variant: "success",
          ...options,
          style: { ...TOAST_SUCCESS_STYLE, ...options?.style },
        }),
      warning: (message: string, options?: OptionsObject<"warning">) =>
        enqueueSnackbar(message, {
          variant: "warning",
          ...options,
          style: { ...TOAST_WARNING_STYLE, ...options?.style },
        }),
    },
  };
};
