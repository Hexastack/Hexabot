/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
