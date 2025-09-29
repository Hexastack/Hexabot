/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import Add from "@mui/icons-material/Add";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import MoveUp from "@mui/icons-material/MoveUp";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  debounce,
  Grid,
  styled,
  Tab,
  Tabs,
  tabsClasses,
} from "@mui/material";
import { Node, useNodesInitialized, Viewport } from "@xyflow/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  KeyboardEventHandler,
  SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { BlockType, IBlock, Pattern } from "@/types/block.types";
import { PermissionAction } from "@/types/permission.types";

import { BlockSearchPanel } from "../BlockSearchPanel";

import { useCreateBlock } from "./hooks/useCreateBlocks";
import { useDeleteManyBlocksDialog } from "./hooks/useDeleteManyBlocksDialog";
import { useMoveBlocksDialog } from "./hooks/useMoveBlocksDialog";
import { useVisualEditorV3 } from "./hooks/useVisualEditorV3";
import {
  getAttachedLinksFromBlocks,
  getNextBlocksLinksFromBlocks,
  getNodesFromBlocks,
} from "./utils/block.utils";

const StyledButton = styled(Button)(() => ({
  marginTop: "7px",
  marginLeft: "5px",
  marginRight: "5px",
  borderRadius: "0",
  minHeight: "30px",
  border: "1px solid #DDDDDD",
  backgroundColor: "#F8F8F8",
  borderBottom: "none",
  width: "42px",
  minWidth: "42px",
}));

export type NodeBlockData = {
  type: BlockType;
  title: string;
  message: string | string[];
  starts_conversation?: boolean;
  patterns?: Pattern[];
};

export type NodeData = Node<NodeBlockData>;

const ReactFlowWrapper = dynamic(() => import("./ReactFlowWrapper"), {
  ssr: false,
});
const Diagrams3 = () => {
  const nodesInitialized = useNodesInitialized();
  const { t } = useTranslate();
  const router = useRouter();
  const dialogs = useDialogs();
  const {
    getNode,
    selectNodes,
    selectedNodeIds,
    setSelectedNodeIds,
    selectedCategoryId,
    screenToFlowPosition,
    setSelectedCategoryId,
    fitView,
  } = useVisualEditorV3();
  const { createNode, createNodes } = useCreateBlock();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const hasPermission = useHasPermission();
  const { openDeleteManyDialog } = useDeleteManyBlocksDialog();
  const { openMoveDialog, onCategoryChange } = useMoveBlocksDialog();
  const { searchPayload } = useSearch<EntityType.BLOCK>({
    $eq: [{ category: selectedCategoryId }],
  });
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
    {
      onSuccess([category]) {
        if (!selectedCategoryId) {
          setSelectedCategoryId(category?.id);
        }
      },
    },
  );
  const { mutate: updateCategory } = useUpdate(EntityType.CATEGORY, {
    invalidate: false,
  });
  const { mutate: updateBlock } = useUpdate(EntityType.BLOCK, {
    invalidate: false,
  });
  const { data: blocks } = useFind(
    { entity: EntityType.BLOCK, format: Format.FULL },
    { hasCount: false, params: searchPayload },
    {
      enabled: !!selectedCategoryId,
    },
  );
  const changeHandler = (_event: SyntheticEvent, categoryIndex: number) => {
    onCategoryChange(categoryIndex);
  };
  const selectedItemsTranslation = t(
    selectedNodeIds.length > 1
      ? "message.items_selected"
      : "message.item_selected",
    { "0": selectedNodeIds.length.toString() },
  );
  const nextBlocksLinks = useMemo(
    () => getNextBlocksLinksFromBlocks(blocks),
    [
      JSON.stringify(
        blocks.map((b) => {
          return { ...b, position: undefined, updatedAt: undefined };
        }),
      ),
    ],
  );
  const attachedLinks = useMemo(
    () => getAttachedLinksFromBlocks(blocks),
    [
      JSON.stringify(
        blocks.map((b) => {
          return { ...b, position: undefined, updatedAt: undefined };
        }),
      ),
    ],
  );
  const nodes = useMemo(() => {
    return getNodesFromBlocks(blocks);
  }, [
    JSON.stringify(
      blocks.map((b) => {
        return { ...b, position: undefined, updatedAt: undefined };
      }),
    ),
  ]);
  const currentCategory = useMemo(() => {
    return categories.find(({ id }) => id === selectedCategoryId);
  }, [categories, selectedCategoryId]);
  const tabIndex = useMemo(() => {
    return currentCategory
      ? categories?.findIndex(({ id }) => id === selectedCategoryId)
      : 0;
  }, [categories, currentCategory, selectedCategoryId]);
  const defaultViewport = useMemo(() => {
    if (currentCategory) {
      const { offset = [0, 0], zoom = 1 } = currentCategory;

      return {
        x: offset?.[0],
        y: offset?.[1],
        zoom,
        // zoom: zoom > 1 ? zoom / 100 : zoom,
      };
    }

    return {
      x: 0,
      y: 0,
      zoom: 1,
    };
  }, [currentCategory]);
  const keyDownHandler: KeyboardEventHandler<HTMLDivElement> = (e) => {
    const isCmdF = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";

    if (isCmdF) {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  const debouncedUpdateBlock = debounce(
    ({ id, ...rest }: Partial<IBlock> & { id: string }) => {
      updateBlock(
        {
          id,
          params: {
            ...rest,
          },
        },
        {
          onSuccess(data) {
            setSelectedNodeIds([data.id]);
          },
        },
      );
    },
    400,
  );
  const debouncedUpdateCategory = debounce(({ zoom, x, y }: Viewport) => {
    if (selectedCategoryId) {
      updateCategory({
        id: selectedCategoryId,
        params: {
          zoom,
          // zoom: zoom < 1 ? zoom * 100 : zoom,
          offset: [x, y],
        },
      });
    }
  }, 400);

  useEffect(() => {
    const { id: flowId } = router.query;

    if (flowId) {
      if (typeof flowId === "string") {
        setSelectedCategoryId(flowId);
      }
    } else if (categories[0]?.id) {
      setSelectedCategoryId(categories[0].id);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.id]);

  useEffect(() => {
    const { blockId } = router.query;

    if (nodesInitialized && typeof blockId === "string" && blockId) {
      selectNodes([blockId]);
      const node = getNode(blockId);

      if (node) {
        fitView({ nodes: [node], padding: "150px", duration: 200 });
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, router.query]);

  return (
    <div
      className="visual-editor"
      id="visual-editor"
      onDrop={(event) => {
        const stormDiagramNode = event.dataTransfer.getData(
          "storm-diagram-node-v3",
        );

        if (!stormDiagramNode) return;
        const data = JSON.parse(stormDiagramNode);

        if (!data) {
          // eslint-disable-next-line no-console
          console.warn("Unable to handle the drop event");

          return;
        }

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const payload = {
          ...data,
          category: selectedCategoryId || "",
          position,
        };

        createNode(undefined, payload);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Grid sx={{ bgcolor: "#fff", padding: "0" }}>
          <Grid
            sx={{
              display: "flex",
              position: "relative",
              flexDirection: "row",
              borderBottom: "1.5px solid #DDDDDD",
            }}
          >
            <Tabs
              value={tabIndex}
              onChange={changeHandler}
              sx={{
                backgroundColor: "#fff",
                [`& .${tabsClasses.indicator}`]: {
                  display: "none",
                },
                "& .MuiTabs-scrollButtons": {
                  opacity: 0.8,
                  backgroundColor: "#1ca089",
                  borderTop: "1px solid #137261",
                  marginTop: "7px",
                  color: "#FFF",
                  overflow: "visible",
                  boxShadow:
                    "-20px 0px 20px -20px rgba(0, 0, 0, 0.5), 0px 2px 9px 0px rgba(0, 0, 0, 0.5)",
                  zIndex: 10,
                  "&:hover": {
                    opacity: 1,
                  },
                },
              }}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              {categories?.map(({ id, label }) => (
                <Tab
                  sx={{
                    mt: "7px",
                    ml: "5px",
                    border: "1px solid #DDDDDD",
                    backgroundColor: "#F8F8F8",
                    borderBottom: "none",
                    minHeight: "30px",
                    "&.Mui-selected": {
                      backgroundColor: "#EAF1F1",
                      zIndex: 1,
                      color: "#000",
                      backgroundSize: "20px 20px",
                      backgroundAttachment: "fixed",
                      backgroundPosition: "-1px -1px",
                    },
                  }}
                  key={id}
                  label={
                    <Grid
                      sx={{
                        alignItems: "center",
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {label}
                    </Grid>
                  }
                />
              ))}
            </Tabs>
            {hasPermission(EntityType.CATEGORY, PermissionAction.CREATE) ? (
              <StyledButton
                onClick={(e) => {
                  dialogs.open(CategoryFormDialog, { defaultValues: null });
                  e.preventDefault();
                }}
              >
                <Add />
              </StyledButton>
            ) : null}
            <StyledButton
              sx={{
                ml: "auto",
              }}
              title={t("label.search_blocks_panel_header")}
              onClick={(e) => {
                setSearchOpen((prev) => !prev);
                e.preventDefault();
              }}
            >
              <SearchIcon />
            </StyledButton>
          </Grid>
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
                  <Button
                    variant="contained"
                    startIcon={<MoveUp />}
                    onClick={() => openMoveDialog()}
                    disabled={selectedNodeIds.length <= 1}
                  >
                    {t("button.move")}
                  </Button>
                ) : null}
                {hasPermission(EntityType.BLOCK, PermissionAction.CREATE) ? (
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyRounded />}
                    onClick={() => createNodes(selectedNodeIds)}
                    disabled={selectedNodeIds.length <= 1}
                  >
                    {t("button.duplicate")}
                  </Button>
                ) : null}
                {hasPermission(EntityType.BLOCK, PermissionAction.DELETE) ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      openDeleteManyDialog();
                    }}
                    disabled={selectedNodeIds.length <= 1}
                  >
                    {t("button.remove")}
                  </Button>
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
        </Grid>
      </Box>
      <Box
        ref={canvasRef}
        height="100%"
        position="relative"
        onKeyDown={keyDownHandler}
      >
        {currentCategory ? (
          <ReactFlowWrapper
            defaultEdges={[...nextBlocksLinks, ...attachedLinks]}
            defaultNodes={nodes}
            defaultViewport={defaultViewport}
            onMoveNode={debouncedUpdateBlock}
            onViewport={debouncedUpdateCategory}
          />
        ) : null}
        <BlockSearchPanel
          canvasRef={canvasRef}
          open={isSearchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </Box>
    </div>
  );
};

export default Diagrams3;
