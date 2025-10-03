/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import MoveUp from "@mui/icons-material/MoveUp";
import { Button, ButtonGroup, ButtonProps, Chip, Grid } from "@mui/material";
import { useMemo } from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { PermissionAction } from "@/types/permission.types";

import { useCreateBlock } from "../../hooks/useCreateBlocks";
import { useDeleteManyBlocksDialog } from "../../hooks/useDeleteManyBlocksDialog";
import { useMoveBlocksDialog } from "../../hooks/useMoveBlocksDialog";
import { useVisualEditor } from "../../hooks/useVisualEditor";

const ControlButton = ({
  children,
  selectedNodeIds,
  ...rest
}: ButtonProps & { selectedNodeIds: string[] }) => (
  <Button
    sx={{ fontSize: "11px" }}
    size="small"
    variant="contained"
    disabled={selectedNodeIds.length <= 1}
    {...rest}
  >
    {children}
  </Button>
);

export const BulkButtonsGroup = () => {
  const hasPermission = useHasPermission();
  const { t } = useTranslate();
  const { selectedNodeIds } = useVisualEditor();
  const { createNodes } = useCreateBlock();
  const { openMoveDialog } = useMoveBlocksDialog();
  const { openDeleteManyDialog } = useDeleteManyBlocksDialog();
  const selectedItemsTranslation = useMemo(
    () =>
      t(
        selectedNodeIds.length > 1
          ? "message.items_selected"
          : "message.item_selected",
        { "0": selectedNodeIds.length.toString() },
      ),
    [selectedNodeIds, t],
  );

  return (
    <Grid
      item
      id="visual-editor-horizontal-controls"
      sx={{
        left: 240,
        top: 140,
        zIndex: 1,
        position: "absolute",
        display: "flex",
        flexDirection: "row",
      }}
      gap="10px"
    >
      <Grid item>
        <ButtonGroup size="small">
          {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
            <ControlButton
              onClick={() => openMoveDialog()}
              startIcon={<MoveUp />}
              selectedNodeIds={selectedNodeIds}
            >
              {t("button.move")}
            </ControlButton>
          ) : null}
          {hasPermission(EntityType.BLOCK, PermissionAction.CREATE) ? (
            <ControlButton
              onClick={() => createNodes(selectedNodeIds)}
              startIcon={<ContentCopyRounded />}
              selectedNodeIds={selectedNodeIds}
            >
              {t("button.duplicate")}
            </ControlButton>
          ) : null}
          {hasPermission(EntityType.BLOCK, PermissionAction.DELETE) ? (
            <ControlButton
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={() => {
                openDeleteManyDialog();
              }}
              selectedNodeIds={selectedNodeIds}
            >
              {t("button.remove")}
            </ControlButton>
          ) : null}
        </ButtonGroup>
      </Grid>
      {selectedNodeIds.length ? (
        <Grid item alignContent="center">
          <Chip
            sx={{ backgroundColor: "#fffc" }}
            component="a"
            size="small"
            label={selectedItemsTranslation}
            color="info"
            variant="outlined"
          />
        </Grid>
      ) : null}
    </Grid>
  );
};
