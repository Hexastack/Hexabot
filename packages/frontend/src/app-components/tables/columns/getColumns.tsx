/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stack, Tooltip } from "@mui/material";
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridTreeNodeWithRender,
  GridValidRowModel,
} from "@mui/x-data-grid";
import {
  CheckCircle2,
  FileText,
  List,
  ListOrdered,
  Pencil,
  RefreshCw,
  Shield,
  Tag,
  Trash2,
  UserCog,
} from "lucide-react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { theme } from "@/layout/theme";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

export enum ActionColumnLabel {
  Edit = "Edit",
  Delete = "Delete",
  Values = "Values",
  Manage_Roles = "Manage_Roles",
  Permissions = "Permissions",
  Content = "Content",
  Fields = "Fields",
  Manage_Labels = "Manage_Labels",
  Toggle = "Toggle",
  Annotate = "Annotate",
}

const ACTION_COLUMN_LABEL_MAP: Record<ActionColumnLabel, TTranslationKeys> = {
  [ActionColumnLabel.Edit]: "button.edit",
  [ActionColumnLabel.Delete]: "button.delete",
  [ActionColumnLabel.Values]: "button.values",
  [ActionColumnLabel.Manage_Roles]: "button.manage_roles",
  [ActionColumnLabel.Permissions]: "button.permissions",
  [ActionColumnLabel.Content]: "button.content",
  [ActionColumnLabel.Fields]: "button.fields",
  [ActionColumnLabel.Manage_Labels]: "title.manage_labels",
  [ActionColumnLabel.Toggle]: "button.toggle",
  [ActionColumnLabel.Annotate]: "button.annotate",
} as const;

export interface ActionColumn<T extends GridValidRowModel> {
  label: ActionColumnLabel;
  action?: (row: T) => void;
  requires?: PermissionAction[];
  getState?: (row: T) => boolean;
  helperText?: string;
  isDisabled?: (row: T) => boolean;
}

const BUTTON_WIDTH = 60;
const ACTION_ICON_SIZE = 18;

export const getActionsWidth = (itemsNumber: number) =>
  itemsNumber === 1 ? BUTTON_WIDTH + 60 : BUTTON_WIDTH * itemsNumber;

function ActionIcon(label: ActionColumnLabel) {
  switch (label) {
    case ActionColumnLabel.Edit:
      return <Pencil size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Delete:
      return <Trash2 size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Values:
      return <List size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Manage_Roles:
      return <UserCog size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Permissions:
      return <Shield size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Content:
      return <FileText size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Fields:
      return <ListOrdered size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Manage_Labels:
      return <Tag size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Toggle:
      return <CheckCircle2 size={ACTION_ICON_SIZE} />;
    case ActionColumnLabel.Annotate:
      return <RefreshCw size={ACTION_ICON_SIZE} />;
    default:
      return <></>;
  }
}

function getColor(label: ActionColumnLabel) {
  switch (label) {
    case ActionColumnLabel.Edit:
      return theme.palette.grey[900];
    case ActionColumnLabel.Delete:
      return theme.palette.error.main;
    default:
      return theme.palette.primary.main;
  }
}

function StackComponent<T extends GridValidRowModel>({
  actions,
  params,
}: {
  actions: ActionColumn<T>[];
  params: GridRenderCellParams<T, any, any, GridTreeNodeWithRender>;
}) {
  const { t } = useTranslate();

  return (
    <Stack height="100%" alignItems="center" direction="row" spacing={0.5}>
      {actions.map(
        ({
          label,
          action,
          requires = [],
          getState,
          helperText,
          isDisabled,
        }) => (
          <GridActionsCellItem
            key={label}
            className="actionButton"
            icon={
              <Tooltip
                title={helperText || String(t(ACTION_COLUMN_LABEL_MAP[label]))}
              >
                {ActionIcon(label)}
              </Tooltip>
            }
            label={helperText || t(ACTION_COLUMN_LABEL_MAP[label])}
            showInMenu={false}
            sx={{
              color:
                label === ActionColumnLabel.Toggle &&
                getState &&
                getState(params.row)
                  ? getColor(label)
                  : theme.palette.grey[600],
              "&:hover": {
                color: getColor(label),
              },
            }}
            disabled={
              (isDisabled && isDisabled(params.row)) ||
              (params.row.builtin && requires.includes(PermissionAction.DELETE))
            }
            onClick={() => {
              action && action(params.row);
            }}
          />
        ),
      )}
    </Stack>
  );
}

export const getActionsColumn = <T extends GridValidRowModel>(
  actions: ActionColumn<T>[],
  headerName: string,
): GridColDef<T> => {
  return {
    maxWidth: getActionsWidth(actions.length),
    field: "actions",
    headerName,
    sortable: false,
    minWidth: getActionsWidth(actions.length),
    align: "center",
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
