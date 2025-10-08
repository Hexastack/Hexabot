/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ContentCopyRounded } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoveUp from "@mui/icons-material/MoveUp";
import { ButtonGroup, Divider, Grid, IconButton, styled } from "@mui/material";
import { useMemo } from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useCreateBlock } from "../../hooks/useCreateBlocks";
import { useDeleteManyBlocksDialog } from "../../hooks/useDeleteManyBlocksDialog";
import { useEditBlockDialog } from "../../hooks/useEditBlockDialog";
import { useMoveBlocksDialog } from "../../hooks/useMoveBlocksDialog";
import { useVisualEditor } from "../../hooks/useVisualEditor";
import { TooltipIcon } from "../TooltipIcon";

export const StyledIconButton = styled(IconButton)(() => ({
  color: "#444",
  backgroundColor: "transparent",
  "&:hover": { borderRadius: "0px" },
}));

export const NodeControls = ({ blockId }: { blockId: string }) => {
  const hasPermission = useHasPermission();
  const { selectedNodeIds } = useVisualEditor();
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
          <StyledIconButton
            onClick={() => openEditDialog(blockId)}
            disabled={shouldDisableControlButton}
          >
            <TooltipIcon translationKey="button.edit" icon={EditIcon} />
          </StyledIconButton>
        ) : null}
        <Divider orientation="vertical" />
        {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
          <StyledIconButton
            onClick={() => openMoveDialog()}
            disabled={shouldDisableControlButton}
          >
            <TooltipIcon translationKey="button.move" icon={MoveUp} />
          </StyledIconButton>
        ) : null}
        <Divider orientation="vertical" />
        {hasPermission(EntityType.BLOCK, PermissionAction.CREATE) ? (
          <StyledIconButton
            onClick={() => createNode(blockId)}
            disabled={shouldDisableControlButton}
          >
            <TooltipIcon
              translationKey="button.duplicate"
              icon={ContentCopyRounded}
            />
          </StyledIconButton>
        ) : null}
        <Divider orientation="vertical" />
        {hasPermission(EntityType.BLOCK, PermissionAction.DELETE) ? (
          <StyledIconButton
            onClick={() => {
              openDeleteManyDialog(selectedNodeIds);
            }}
            disabled={shouldDisableControlButton}
          >
            <TooltipIcon translationKey="button.remove" icon={DeleteIcon} />
          </StyledIconButton>
        ) : null}
      </ButtonGroup>
    </Grid>
  );
};
