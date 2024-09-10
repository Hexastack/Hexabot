/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
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
import { useTranslation } from "react-i18next";

import { useHasPermission } from "@/hooks/useHasPermission";
import { theme } from "@/layout/themes/theme";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

export enum ActionColumnLabel {
  Edit = "button.edit",
  Delete = "button.delete",
  Values = "button.values",
  Manage_Roles = "button.manage_roles",
  Permissions = "button.permissions",
  Content = "button.content",
  Fields = "button.fields",
  Manage_Labels = "title.manage_labels",
}

export interface ActionColumn<T extends GridValidRowModel> {
  label: ActionColumnLabel;
  action?: (row: T) => void;
  requires?: PermissionAction[];
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
    default:
      return <></>;
  }
}

function getColor(label: ActionColumnLabel) {
  switch (label) {
    case ActionColumnLabel.Edit:
      return theme.palette.warning.main;
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
  const { t } = useTranslation();

  return (
    <Stack height="100%" alignItems="center" direction="row" spacing={0.5}>
      {actions.map(({ label, action, requires = [] }) => (
        <GridActionsCellItem
          key={label}
          className="actionButton"
          icon={<Tooltip title={t(label)}>{getIcon(label)}</Tooltip>}
          label={t(label)}
          showInMenu={false}
          sx={{
            color: "grey",
            "&:hover": {
              color: getColor(label),
            },
          }}
          disabled={
            params.row.builtin &&
            (requires.includes(PermissionAction.UPDATE) ||
              requires.includes(PermissionAction.DELETE))
          }
          onClick={() => {
            action && action(params.row);
          }}
        />
      ))}
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
