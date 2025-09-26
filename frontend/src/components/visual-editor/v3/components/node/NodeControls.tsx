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
import MoveUp from "@mui/icons-material/MoveUp";
import { ButtonGroup, Divider, Grid, IconButton, Tooltip } from "@mui/material";
import { useMemo } from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useCreateBlock } from "../../hooks/useCreateBlocks";
import { useDeleteManyBlocksDialog } from "../../hooks/useDeleteManyBlocksDialog";
import { useEditBlockDialog } from "../../hooks/useEditBlockDialog";
import { useMoveBlocksDialog } from "../../hooks/useMoveBlocksDialog";
import { useVisualEditorV3 } from "../../hooks/useVisualEditorV3";

export const NodeControls = ({ blockId }: { blockId: string }) => {
  const { t } = useTranslate();
  const hasPermission = useHasPermission();
  const { selectedNodeIds } = useVisualEditorV3();
  const { createNode } = useCreateBlock();
  const { openEditDialog } = useEditBlockDialog();
  const { openMoveDialog } = useMoveBlocksDialog();
  const { openDeleteManyDialog } = useDeleteManyBlocksDialog();
  const shouldDisableControlButton = useMemo(
    () => selectedNodeIds.length !== 1,
    [selectedNodeIds],
  );

  return (
    <Grid id="node-controls">
      <ButtonGroup size="small">
        {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => openEditDialog(blockId)}
            disabled={shouldDisableControlButton}
          >
            <Tooltip title={t("button.edit")} placement="top" arrow>
              <EditIcon sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        ) : null}
        <Divider orientation="vertical" />
        {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => openMoveDialog()}
            disabled={shouldDisableControlButton}
          >
            <Tooltip title={t("button.move")} placement="top" arrow>
              <MoveUp sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        ) : null}
        <Divider orientation="vertical" />
        {hasPermission(EntityType.BLOCK, PermissionAction.CREATE) ? (
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => createNode(blockId)}
            disabled={shouldDisableControlButton}
          >
            <Tooltip title={t("button.duplicate")} placement="top" arrow>
              <ContentCopyRounded sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        ) : null}
        <Divider orientation="vertical" />
        {hasPermission(EntityType.BLOCK, PermissionAction.DELETE) ? (
          <IconButton
            sx={{ color: "#444" }}
            onClick={() => openDeleteManyDialog(selectedNodeIds)}
            disabled={shouldDisableControlButton}
          >
            <Tooltip title={t("button.remove")} placement="top" arrow>
              <DeleteIcon sx={{ fontSize: "20px" }} />
            </Tooltip>
          </IconButton>
        ) : null}
      </ButtonGroup>
    </Grid>
  );
};
