/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, ButtonProps } from "@mui/material";
import { PropsWithChildren } from "react";

import { THook } from "@/types/base.types";
import { TPayload } from "@/types/common/dialogs.types";
import { PermissionAction } from "@/types/permission.types";

import { BASE_ADD_DIALOG_MAP } from "../../dialogs/dialog.constants";

import { EntityButtonWrapper } from "./EntityButtonWrapper";

export const WithEntityButton = <
  T extends typeof BASE_ADD_DIALOG_MAP,
  TE extends keyof typeof BASE_ADD_DIALOG_MAP,
  TD extends THook<{ entity: TE }>["basic"],
  TP extends TPayload<TD, T[TE]["presetValues"]>,
>({
  entity,
  payload,
  children,
  slotProps,
  permissionAction,
  enableEntityAddButton,
}: PropsWithChildren<{
  entity: TE;
  payload?: TP;
  slotProps?: ButtonProps;
  permissionAction: PermissionAction;
  enableEntityAddButton?: boolean;
}>) => {
  const Button = (
    <EntityButtonWrapper
      entity={entity}
      confirmOptions={payload}
      permissionAction={permissionAction}
      {...slotProps}
    />
  );

  return Button && enableEntityAddButton ? (
    <Box display="flex" gap={1} alignItems="flex-end">
      <Box flex={1}>{children}</Box>
      {Button}
    </Box>
  ) : (
    children
  );
};
