/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import CachedIcon from "@mui/icons-material/Cached";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import TocOutlinedIcon from "@mui/icons-material/TocOutlined";
import ViewListIcon from "@mui/icons-material/ViewListOutlined";
import { Stack, Tooltip } from "@mui/material";
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridTreeNodeWithRender,
  GridValidRowModel,
} from "@mui/x-data-grid";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { TTranslationKeys } from "@/i18n/i18n.types";
import { theme } from "@/layout/themes/theme";
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

export const getActionsWidth = (itemsNumber: number) =>
  itemsNumber === 1 ? BUTTON_WIDTH + 60 : BUTTON_WIDTH * itemsNumber;

function getIcon(label: ActionColumnLabel) {
  switch (label) {
    case ActionColumnLabel.Edit:
      return <EditIcon />;
    case ActionColumnLabel.Delete:
      return <DeleteIcon />;
    case ActionColumnLabel.Values:
      return <ViewListIcon />;
    case ActionColumnLabel.Manage_Roles:
      return <ManageAccountsIcon />;
    case ActionColumnLabel.Permissions:
      return <AdminPanelSettingsIcon />;
    case ActionColumnLabel.Content:
      return <ListAltOutlinedIcon />;
    case ActionColumnLabel.Fields:
      return <TocOutlinedIcon />;
    case ActionColumnLabel.Manage_Labels:
      return <LocalOfferIcon />;
    case ActionColumnLabel.Toggle:
      return <CheckCircleIcon />;
    case ActionColumnLabel.Annotate:
      return <CachedIcon />;
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
                {getIcon(label)}
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
              (params.row.builtin &&
                  requires.includes(PermissionAction.DELETE))
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
