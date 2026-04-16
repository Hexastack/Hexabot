/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconButtonOwnProps, Stack, Tooltip } from "@mui/material";
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridTreeNodeWithRender,
  GridValidRowModel,
} from "@mui/x-data-grid";
import {
  Eye,
  FileText,
  LucideProps,
  Pencil,
  RefreshCw,
  Shield,
  Tag,
  TestTube,
  Trash2,
  UserCog,
  Wrench,
} from "lucide-react";
import { FunctionComponent } from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

export enum ColumnActionType {
  Edit = "Edit",
  Delete = "Delete",
  Manage_Roles = "Manage_Roles",
  Permissions = "Permissions",
  Content = "Content",
  Manage_Labels = "Manage_Labels",
  Annotate = "Annotate",
  Test = "Test",
  Tools = "Tools",
  View = "View",
}

const COLUMN_ACTION_CONFIG_MAP: Record<
  ColumnActionType,
  {
    label: TTranslationKeys;
    icon: FunctionComponent<LucideProps>;
    color?: IconButtonOwnProps["color"];
  }
> = {
  [ColumnActionType.Edit]: {
    label: "button.edit",
    icon: Pencil,
    color: "warning",
  },
  [ColumnActionType.Delete]: {
    label: "button.delete",
    icon: Trash2,
    color: "error",
  },
  [ColumnActionType.Manage_Roles]: {
    label: "button.manage_roles",
    icon: UserCog,
  },
  [ColumnActionType.Permissions]: { label: "button.permissions", icon: Shield },
  [ColumnActionType.Content]: { label: "button.content", icon: FileText },
  [ColumnActionType.Manage_Labels]: {
    label: "title.manage_labels",
    icon: Tag,
  },
  [ColumnActionType.Annotate]: { label: "button.annotate", icon: RefreshCw },
  [ColumnActionType.Test]: { label: "button.test_connection", icon: TestTube },
  [ColumnActionType.Tools]: { label: "button.tools", icon: Wrench },
  [ColumnActionType.View]: { label: "button.view", icon: Eye },
} as const;

export interface ActionColumn<T extends GridValidRowModel> {
  action: ColumnActionType;
  onClick?: (row: T) => void;
  requires?: PermissionAction[];
  helperText?: string;
  isDisabled?: (row: T) => boolean;
}

const ACTION_ICON_SIZE = 18;

function StackComponent<T extends GridValidRowModel>({
  actions,
  params,
}: {
  actions: ActionColumn<T>[];
  params: GridRenderCellParams<T, any, any, GridTreeNodeWithRender>;
}) {
  const { t } = useTranslate();

  return (
    <Stack>
      {actions.map(
        ({ action, onClick, requires = [], helperText, isDisabled }) => {
          const {
            icon: Icon,
            label: labelKey,
            color = "primary",
          } = COLUMN_ACTION_CONFIG_MAP[action];
          const label = helperText || t(labelKey);

          return (
            <Tooltip key={action} title={label}>
              <GridActionsCellItem
                icon={<Icon size={ACTION_ICON_SIZE} />}
                label={label}
                showInMenu={false}
                color={color}
                disabled={
                  (isDisabled && isDisabled(params.row)) ||
                  (params.row.builtin &&
                    requires.includes(PermissionAction.DELETE))
                }
                onClick={() => {
                  onClick?.(params.row);
                }}
              />
            </Tooltip>
          );
        },
      )}
    </Stack>
  );
}

export const getActionsColumn = <T extends GridValidRowModel>(
  actions: ActionColumn<T>[],
  headerName: string,
): GridColDef<T> => {
  return {
    field: "actions",
    headerName,
    sortable: false,
    align: "left",
    headerAlign: "left",
    renderCell: (params) => (
      <StackComponent actions={actions} params={params} />
    ),
  };
};

export const useActionColumns = <T extends GridValidRowModel>(
  type: EntityType,
  actions: ActionColumn<T>[],
  headerName: string,
) => {
  const hasPermission = useHasPermission();

  return getActionsColumn(
    actions.filter(
      ({ requires }) =>
        !requires || requires.every((action) => hasPermission(type, action)),
    ),
    headerName,
  );
};
