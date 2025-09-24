/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ContentCopyRounded } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { useMemo } from "react";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { BlockEditFormDialog } from "@/components/visual-editor/BlockEditFormDialog";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useVisualEditorV3 } from "../../hooks/useVisualEditorV3";

export const NodeControls = ({ blockId }: { blockId: string }) => {
  const { t } = useTranslate();
  const hasPermission = useHasPermission();
  const { createNode, selectedNodeIds } = useVisualEditorV3();
  const dialogs = useDialogs();
  const shouldDisableDuplicateButton = selectedNodeIds.length !== 1;
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const { mutate: deleteBlocks } = useDeleteMany(EntityType.BLOCK);
  const openEditDialog = (selectedBlockId: string) => {
    const block = getBlockFromCache(selectedBlockId);

    dialogs.open(
      BlockEditFormDialog,
      { defaultValues: block },
      {
        maxWidth: "md",
        isSingleton: true,
      },
    );
  };
  const openDeleteDialog = async (ids: string[], cb?: () => void) => {
    if (ids.length) {
      const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
        mode: "selection",
        count: ids.length,
        isSingleton: true,
      });

      if (isConfirmed) {
        deleteBlocks(ids);
        cb?.();
      }
    }
  };
  const isSelected = useMemo(() => {
    return selectedNodeIds.includes(blockId);
  }, [selectedNodeIds]);

  return (
    <Grid
      sx={{
        position: "absolute",
        borderRadius: "12px 12px 0 0",
        padding: "0px 6px",
        top: "-40px",
        right: "-10px",
        display: isSelected ? "flex" : "none",
      }}
    >
      {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
        <Grid item>
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => {
              openEditDialog(blockId);
            }}
            disabled={selectedNodeIds.length !== 1}
          >
            <Tooltip title={t("button.edit")} placement="top" arrow>
              <EditIcon sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        </Grid>
      ) : null}
      {hasPermission(EntityType.BLOCK, PermissionAction.CREATE) ? (
        <Grid item>
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => createNode(blockId)}
            disabled={shouldDisableDuplicateButton}
          >
            <Tooltip title={t("button.duplicate")} placement="top" arrow>
              <ContentCopyRounded sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        </Grid>
      ) : null}
      {hasPermission(EntityType.BLOCK, PermissionAction.DELETE) ? (
        <Grid item>
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => openDeleteDialog(selectedNodeIds)}
            disabled={shouldDisableDuplicateButton}
          >
            <Tooltip title={t("button.remove")} placement="top" arrow>
              <DeleteIcon sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        </Grid>
      ) : null}
    </Grid>
  );
};
