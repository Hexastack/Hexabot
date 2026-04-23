/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { Button, ButtonGroup, ButtonProps } from "@mui/material";
import { Plus as AddIcon, Trash2 as DeleteIcon } from "lucide-react";
import React from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

const COMMON_BUTTON_PROPS: Partial<ButtonProps> = {
  variant: "contained",
};

export type ButtonActionsGroupProps = {
  entity?: EntityType;
  buttons: (Partial<ButtonProps> & {
    permissions?: Partial<Record<EntityType, Action>>;
    permissionAction?: Action;
  })[];
};

export const ButtonActionsGroup = ({
  entity,
  buttons,
}: ButtonActionsGroupProps) => {
  const { t } = useTranslate();
  const hasPermission = useHasPermission();
  const defaultProps: Partial<Record<Action, Partial<ButtonProps>>> = {
    [Action.CREATE]: {
      children: t("button.add"),
      startIcon: <AddIcon />,
    },
    [Action.DELETE]: {
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
            return (
              <Button key={`button_${index}`} size="small" {...extendedProps} />
            );
          }
        }

        return null;
      })}
    </ButtonGroup>
  );
};
