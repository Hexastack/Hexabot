/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  OptionsObject,
  enqueueSnackbar,
  SnackbarProvider as ToastProvider,
} from "notistack";

export { ToastProvider };

const TOAST_COMMON_STYLE = {
  border: "1px solid",
  fontWeight: "500",
  borderRadius: "36px",
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

export const useToast = () => ({
  toast: {
    error: (message: string, options?: OptionsObject<"error">) =>
      enqueueSnackbar(message, {
        variant: "error",
        ...options,
        style: { ...TOAST_ERROR_STYLE, ...options?.style },
      }),
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
});
