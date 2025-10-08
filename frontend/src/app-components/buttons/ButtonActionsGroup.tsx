/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button, ButtonGroup, ButtonProps } from "@mui/material";
import React from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

const COMMON_BUTTON_PROPS: Partial<ButtonProps> = {
  variant: "contained",
};

export const ButtonActionsGroup = ({
  entity,
  buttons,
}: {
  entity?: EntityType;
  buttons: (
    | Partial<ButtonProps> & {
        permissions?: Partial<Record<EntityType, PermissionAction>>;
        permissionAction?: PermissionAction;
      }
  )[];
}) => {
  const { t } = useTranslate();
  const hasPermission = useHasPermission();
  const defaultProps: Partial<Record<PermissionAction, Partial<ButtonProps>>> =
    {
      [PermissionAction.CREATE]: {
        children: t("button.add"),
        startIcon: <AddIcon />,
      },
      [PermissionAction.DELETE]: {
        color: "error",
        children: t("button.delete"),
        startIcon: <DeleteIcon />,
      },
    };

  return (
    <ButtonGroup sx={{ ml: "auto" }}>
      {buttons.map(({ permissions, permissionAction, ...rest }, index) => {
        const hasAbility =
          entity && permissionAction && hasPermission(entity, permissionAction);
        const hasAbilities =
          permissions &&
          Object.entries(permissions).every(([entity, permissionAction]) =>
            hasPermission(entity as EntityType, permissionAction),
          );
        const extendedProps = {
          ...COMMON_BUTTON_PROPS,
          ...(permissionAction && defaultProps[permissionAction]),
          ...rest,
        };

        if (hasAbility || hasAbilities) {
          if (React.isValidElement(rest.children)) {
            return rest.children;
          } else {
            return <Button key={`button_${index}`} {...extendedProps} />;
          }
        }

        return null;
      })}
    </ButtonGroup>
  );
};
