/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action } from "@hexabot-ai/types";
import { Box, Button, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import debounce from "@mui/utils/debounce";
import { Menu as MenuIcon, Plus } from "lucide-react";
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

import MenuAccordion from "./MenuAccordion";
import { MenuFormDialog } from "./MenuFormDialog";

export const Menu = () => {
  const { t } = useTranslate();
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const { data: menus } = useFind(
    { entity: EntityType.MENUTREE },
    {
      hasCount: false,
    },
  );
  const { mutate: deleteMenu } = useDelete(EntityType.MENU);
  const [position, setPosition] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [shadowVisible, setShadowVisible] = useState(false);

  return (
    <Grid container gap={3} flexDirection="column">
      <PageHeader icon={MenuIcon} title={t("title.manage_persistent_menu")}>
        <Grid
          justifyContent="flex-end"
          gap={1}
          container
          alignItems="center"
          flexShrink={0}
          width="max-content"
        >
          {hasPermission(EntityType.MENU, Action.CREATE) ? (
            <Button
              variant="contained"
              onClick={() =>
                dialogs.open(MenuFormDialog, {
                  defaultValues: null,
                })
              }
              disabled={menus?.length === 10}
              startIcon={<Plus />}
            >
              {t("button.add")}
            </Button>
          ) : null}
        </Grid>
      </PageHeader>
      {menus?.length === 0 ? (
        <NoDataOverlay />
      ) : (
        <Paper
          ref={ref}
          onMouseMove={debounce((e) => {
            if (!ref.current) return;
            const padding = 16;
            const boxHeight = 56;
            const mousePositionInsideElement =
              e.clientY - ref.current?.getBoundingClientRect().top - padding;
            const currentItem = Math.floor(
              mousePositionInsideElement / boxHeight,
            );
            const maxItem = Math.floor(
              (ref.current.getBoundingClientRect().height - padding - 1) /
                boxHeight,
            );
            const step = Math.max(0, Math.min(currentItem, maxItem - 1));

            if (maxItem <= 0) {
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
                height: "60px",
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
      )}
    </Grid>
  );
};
