/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import FolderIcon from "@mui/icons-material/Folder";
import { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import {
  ActionColumnLabel,
  useActionColumns,
} from "@/app-components/tables/columns/getColumns";
import { renderHeader } from "@/app-components/tables/columns/renderHeader";
import { GenericDataGrid } from "@/app-components/tables/GenericDataGrid";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";
import { getDateTimeFormatter } from "@/utils/date";

import { ICategory } from "../../types/category.types";

import { CategoryFormDialog } from "./CategoryFormDialog";

export const Categories = () => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const dialogs = useDialogs();
  const options = {
    onError: (error: Error) => {
      toast.error(error);
    },
    onSuccess: () => {
      toast.success(t("message.item_delete_success"));
    },
  };
  const { mutate: deleteCategory } = useDelete(EntityType.CATEGORY, options);
  const { mutate: deleteCategories } = useDeleteMany(
    EntityType.CATEGORY,
    options,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const actionColumns = useActionColumns<ICategory>(
    EntityType.CATEGORY,
    [
      {
        label: ActionColumnLabel.Edit,
        action: (row) => {
          dialogs.open(CategoryFormDialog, { defaultValues: row });
        },
        requires: [PermissionAction.UPDATE],
      },
      {
        label: ActionColumnLabel.Delete,
        action: async ({ id }) => {
          const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

          if (isConfirmed) {
            deleteCategory(id);
          }
        },
        requires: [PermissionAction.DELETE],
      },
    ],
    t("label.operations"),
  );
  const columns: GridColDef<ICategory>[] = [
    { field: "id", headerName: "ID" },
    {
      flex: 1,
      field: "label",
      headerName: t("label.label"),
      disableColumnMenu: true,
      renderHeader,
      headerAlign: "left",
    },
    {
      maxWidth: 140,
      field: "createdAt",
      headerName: t("label.createdAt"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.created_at", getDateTimeFormatter(params)),
    },
    {
      maxWidth: 140,
      field: "updatedAt",
      headerName: t("label.updatedAt"),
      disableColumnMenu: true,
      renderHeader,
      resizable: false,
      headerAlign: "left",
      valueGetter: (params) =>
        t("datetime.updated_at", getDateTimeFormatter(params)),
    },
    actionColumns,
  ];
  const handleSelectionChange = (selection: GridRowSelectionModel) => {
    setSelectedCategories(selection as string[]);
  };

  return (
    <GenericDataGrid
      entity={EntityType.CATEGORY}
      buttons={[
        {
          permissionAction: PermissionAction.CREATE,
          onClick: () =>
            dialogs.open(CategoryFormDialog, { defaultValues: null }),
        },
        {
          permissionAction: PermissionAction.DELETE,
          onClick: async () => {
            const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
              mode: "selection",
              count: selectedCategories.length,
            });

            if (isConfirmed) {
              deleteCategories(selectedCategories);
            }
          },
          disabled: !selectedCategories.length,
        },
      ]}
      columns={columns}
      headerIcon={FolderIcon}
      searchParams={{ $iLike: ["label"], syncUrl: true }}
      headerI18nTitle="title.categories"
      selectionChangeHandler={handleSelectionChange}
    />
  );
};
