/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { faBars } from "@fortawesome/free-solid-svg-icons";
import AddIcon from "@mui/icons-material/Add";
import { Box, Button, debounce, Grid, Paper } from "@mui/material";
import { useRef, useState } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { NoDataOverlay } from "@/app-components/tables/NoDataOverlay";
import { useDelete } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { PageHeader } from "@/layout/content/PageHeader";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import MenuAccordion from "./MenuAccordion";
import { MenuFormDialog } from "./MenuFormDialog";

export const Menu = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { data: menus, refetch } = useFind(
    { entity: EntityType.MENUTREE },
    {
      hasCount: false,
    },
  );
  const { mutate: deleteMenu } = useDelete(EntityType.MENU, {
    onSuccess: () => {
      refetch();
    },
  });
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
          {hasPermission(EntityType.MENU, PermissionAction.CREATE) ? (
            <Button
              variant="contained"
              onClick={() =>
                dialogs.open(MenuFormDialog, {
                  defaultValues: null,
                })
              }
              disabled={menus?.length === 10}
              startIcon={<AddIcon />}
            >
              {t("button.add")}
            </Button>
          ) : null}
        </Grid>
      </PageHeader>
      <Paper
        ref={ref}
        onMouseMove={debounce((e) => {
          if (!ref.current) return;
          const padding = 16;
          const boxHeight = 56;
          const mousePositionInsideElement =
            e.clientY - ref.current?.getBoundingClientRect().top - padding;
          const currentBlock = Math.floor(
            mousePositionInsideElement / boxHeight,
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
            onAppend={(parentId) =>
              dialogs.open(MenuFormDialog, {
                defaultValues: { parentId },
              })
            }
            onUpdate={(row) =>
              dialogs.open(MenuFormDialog, {
                defaultValues: { row },
              })
            }
            onDelete={async (row) => {
              const isConfirmed = await dialogs.confirm(ConfirmDialogBody);

              if (isConfirmed) {
                deleteMenu(row.id);
              }
            }}
          />
        ))}
      </Paper>
    </Grid>
  );
};
