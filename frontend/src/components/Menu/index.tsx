/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faBars } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import { Grid, Paper, Button, Box, debounce } from "@mui/material";
import React, { useRef, useState } from "react";


import { DeleteDialog } from "@/app-components/dialogs/DeleteDialog";
import { NoDataOverlay } from "@/app-components/tables/NoDataOverlay";
import { useCreate } from "@/hooks/crud/useCreate";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { IMenuItem } from "@/types/menu.types";
import { PermissionAction } from "@/types/permission.types";

import MenuAccordion from "./MenuAccordion";
import { MenuDialog } from "./MenuDialog";

export const Menu = () => {
  const { t } = useTranslate();
  const [addDialogOpened, setAddDialogOpened] = useState(false);
  const [editDialogOpened, setEditDialogOpened] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(
    undefined,
  );
  const [editRow, setEditRow] = useState<IMenuItem | null>(null);
  const [deleteDialogOpened, setDeleteDialogOpened] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState<string>();
  const hasPermission = useHasPermission();
  const { data: menus, refetch } = useFind(
    { entity: EntityType.MENUTREE },
    {
      hasCount: false,
    },
  );
  const { mutateAsync: createMenu } = useCreate(EntityType.MENU, {
    onSuccess: () => {
      setAddDialogOpened(false);
      refetch();
    },
  });
  const { mutateAsync: updateMenu } = useUpdate(EntityType.MENU, {
    onSuccess: () => {
      setEditDialogOpened(false);
      setEditRow(null);
      refetch();
    },
  });
  const { mutateAsync: deleteMenu } = useDelete(EntityType.MENU, {
    onSuccess: () => {
      setDeleteDialogOpened(false);
      refetch();
    },
  });
  const handleAppend = (menuId: string) => {
    setSelectedMenuId(menuId);
    setAddDialogOpened(true);
    refetch();
  };
  const handleUpdate = (menu: IMenuItem) => {
    setEditRow(menu);
    setEditDialogOpened(true);
  };
  const handleDelete = (menu: IMenuItem) => {
    setDeleteRowId(menu.id);
    setDeleteDialogOpened(true);
  };
  const [position, setPosition] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [shadowVisible, setShadowVisible] = useState(false);

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={faBars} title={t("title.manage_persistent_menu")}>
        <Grid
          justifyContent="flex-end"
          gap={1}
          container
          alignItems="center"
          flexShrink={0}
          width="max-content"
        >
          <Grid item>
            {hasPermission(EntityType.MENU, PermissionAction.CREATE) ? (
              <Button
                variant="contained"
                onClick={() => {
                  setSelectedMenuId(undefined);
                  setAddDialogOpened(true);
                }}
                disabled={menus?.length === 10}
                startIcon={<AddIcon />}
              >
                {t("button.add")}
              </Button>
            ) : null}
          </Grid>
        </Grid>
      </PageHeader>

      <Paper
        ref={ref}
        onMouseMove={debounce((e) => {
          if (!ref.current) return;
          const padding = 16;
          const boxHeight = 56;
          const mousePositonInsideElement =
            e.clientY - ref.current?.getBoundingClientRect().top - padding;
          const currentBlock = Math.floor(
            mousePositonInsideElement / boxHeight,
          );
          const maxBlock = Math.floor(
            (ref.current.getBoundingClientRect().height - padding - 1) /
              boxHeight,
          );
          const step = Math.max(0, Math.min(currentBlock, maxBlock - 1));

          if (maxBlock <= 0) {
            setShadowVisible(false);

            return;
          }
          setPosition(step * boxHeight + padding);
        }, 0)}
        sx={{ padding: 2, position: "relative", overFlow: "hidden" }}
        onMouseLeave={() => setShadowVisible(false)}
        onMouseEnter={() => setShadowVisible(true)}
      >
        <MenuDialog
          open={addDialogOpened}
          parentId={selectedMenuId}
          closeFunction={() => {
            setAddDialogOpened(false);
            setEditDialogOpened(false);
          }}
          createFunction={createMenu}
        />

        {editRow ? (
          <MenuDialog
            row={editRow}
            open={editDialogOpened}
            editFunction={(params) => {
              if (editRow.id) updateMenu({ id: editRow.id, params });
            }}
            closeFunction={() => {
              setEditDialogOpened(false);
              setEditRow(null);
            }}
          />
        ) : null}

        <DeleteDialog
          open={deleteDialogOpened}
          openDialog={() => setDeleteDialogOpened(true)}
          closeDialog={() => setDeleteDialogOpened(false)}
          callback={() => {
            if (deleteRowId) {
              deleteMenu(deleteRowId);
            }
          }}
        />

        {menus?.length > 0 && (
          <Box
            sx={{
              height: "56px",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 20px)",
              borderRadius: "9px",
              backgroundColor: "background.default",
              zIndex: 0,
              opacity: shadowVisible ? 1 : 0,
              transition: "all 0.2s",
              top: `${position}px`,
            }}
          />
        )}
        {menus?.length === 0 && <NoDataOverlay />}
        {menus?.map((menu) => (
          <MenuAccordion
            key={menu.id}
            menu={menu}
            onAppend={handleAppend}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </Paper>
    </Grid>
  );
};
