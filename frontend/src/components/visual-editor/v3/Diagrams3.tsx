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
import EditIcon from "@mui/icons-material/Edit";
import MoveUp from "@mui/icons-material/MoveUp";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  Tab,
  Tabs,
  debounce,
  tabsClasses,
} from "@mui/material";
import { Node } from "@xyflow/react";
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

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { useDeleteFromCache } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate, useUpdateCache } from "@/hooks/crud/useUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format, RouterType } from "@/services/types";
import { IBlock, Pattern } from "@/types/block.types";
import { PermissionAction } from "@/types/permission.types";
import { generateId } from "@/utils/generateId";

import { BlockEditFormDialog } from "../BlockEditFormDialog";
import { BlockSearchPanel } from "../BlockSearchPanel";

import { useVisualEditorV3 } from "./hooks/useVisualEditorV3";
import { getNodesFromBlocks } from "./utils/block.utils";

export type NodeBlockData = {
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
  const { t } = useTranslate();
  const router = useRouter();
  const flowId = router.query.id?.toString();
  const blockId = router.query.blockId?.toString();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(
    blockId,
  );
  const dialogs = useDialogs();
  const hasPermission = useHasPermission();
  const {
    setSelectedCategoryId,
    selectedCategoryId,
    selectedNodes,
    createNode,
    screenToFlowPosition,
  } = useVisualEditorV3();
  const { searchPayload } = useSearch<EntityType.BLOCK>({
    $eq: [{ category: selectedCategoryId }],
  });
  const { toast } = useToast();
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
    {
      onSuccess(categories) {
        const { id } = categories[0] || {};

        if (flowId) {
          setSelectedCategoryId?.(flowId);
        } else if (id) {
          setSelectedCategoryId?.(id);
        }
      },
    },
  );
  const currentCategory = categories.find(
    ({ id }) => id === selectedCategoryId,
  );
  const { mutate: updateCategory } = useUpdate(EntityType.CATEGORY, {
    invalidate: false,
  });
  const { mutate: deleteBlocks } = useDeleteMany(EntityType.BLOCK, {
    onSuccess: () => {
      setSelectedBlockId(undefined);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const { mutate: updateBlock } = useUpdate(EntityType.BLOCK, {
    invalidate: false,
  });
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const updateCachedBlock = useUpdateCache(EntityType.BLOCK);
  const deleteCachedBlock = useDeleteFromCache(EntityType.BLOCK);
  //useMemo
  // const [nodes, setNodes] = useState<Node<NodeBlockData>[]>([]);
  const onCategoryChange = (targetCategory: number) => {
    if (categories) {
      const { id } = categories[targetCategory];

      if (id) {
        setSelectedCategoryId?.(id);
        setSelectedBlockId(undefined); // Reset selected block when switching categories, resetting edit & remove buttons

        router.push(`/${RouterType.VISUAL_EDITOR}/flows/${id}`);
      }
    }
  };
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    onCategoryChange(newValue);
  };
  const { data: blocks } = useFind(
    { entity: EntityType.BLOCK, format: Format.FULL },
    { hasCount: false, params: searchPayload },
    {
      enabled: !!selectedCategoryId,
    },
  );
  const links = useMemo(() => {
    return blocks.flatMap((b) =>
      b.nextBlocks?.map((nb) => ({
        id: generateId(),
        source: b.id,
        target: nb,
      })),
    );
  }, [JSON.stringify(blocks)]);
  const nodes = useMemo(() => {
    return getNodesFromBlocks(blocks);
  }, [JSON.stringify(blocks)]);

  useEffect(() => {
    // Case when categories are already cached
    if (categories?.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update state on router update
    if (flowId) {
      setSelectedCategoryId(flowId);
    } else if (categories?.length) {
      setSelectedCategoryId(categories[0].id);
    }

    if (blockId !== selectedBlockId) {
      setSelectedBlockId(blockId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query]);

  const handleBlocksDeletion = (blockIds: string[]) => {
    deleteBlocks(blockIds, {
      onSuccess: () => {
        blockIds.forEach((blockId) => {
          const block = getBlockFromCache(blockId);

          if (block) {
            updateLinkedBlocks(block, blockIds);
            deleteCachedBlock(blockId);
          }
        });
      },
    });
  };
  const getLinkedBlockIds = (block: IBlock): string[] => [
    ...(block?.nextBlocks || []),
    ...(block?.previousBlocks || []),
    ...(block?.attachedBlock ? [block.attachedBlock] : []),
    ...(block?.attachedToBlock ? [block.attachedToBlock] : []),
  ];
  const updateLinkedBlocks = (block: IBlock, deletedIds: string[]) => {
    const linkedBlockIds = getLinkedBlockIds(block);

    linkedBlockIds.forEach((linkedBlockId) => {
      const linkedBlock = getBlockFromCache(linkedBlockId);

      if (linkedBlock) {
        updateCachedBlock({
          id: linkedBlock.id,
          payload: {
            ...linkedBlock,
            nextBlocks: linkedBlock.nextBlocks?.filter(
              (nextBlockId) => !deletedIds.includes(nextBlockId),
            ),
            previousBlocks: linkedBlock.previousBlocks?.filter(
              (previousBlockId) => !deletedIds.includes(previousBlockId),
            ),
            attachedBlock: deletedIds.includes(linkedBlock.attachedBlock || "")
              ? undefined
              : linkedBlock.attachedBlock,
            attachedToBlock: deletedIds.includes(
              linkedBlock.attachedToBlock || "",
            )
              ? undefined
              : linkedBlock.attachedToBlock,
          },
          strategy: "overwrite",
        });
      }
    });
  };
  const openDeleteDialog = async (ids: string[], cb?: () => void) => {
    if (ids.length) {
      const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
        mode: "selection",
        count: ids.length,
        isSingleton: true,
      });

      if (isConfirmed) {
        onDelete(ids);
        cb?.();
      }
    }
  };
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
  const handleMoveButton = () => {
    // const ids = getSelectedIds();
    // const { blockIds } = getGroupedIds(ids);
    // if (ids.length) {
    //   dialogs.open(BlockMoveFormDialog, {
    //     defaultValues: {
    //       ids: blockIds,
    //       onMove,
    //       category: selectedCategoryId,
    //       categories,
    //     },
    //   });
    // }
  };
  const onDelete = (ids: string[]) => {
    if (!ids || ids?.length === 0) {
      return;
    }

    handleBlocksDeletion(ids);
  };
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    const isCmdF = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";

    if (isCmdF) {
      e.preventDefault();
      setSearchOpen(true);
    }
  };
  const debouncedUpdateBlock = debounce(({ id, ...rest }) => {
    updateBlock({
      id,
      params: {
        ...rest,
      },
    });
  }, 400);
  const debouncedUpdateCategory = debounce(({ zoom, x, y }) => {
    if (selectedCategoryId) {
      updateCategory({
        id: selectedCategoryId,
        params: {
          zoom,
          offset: [x, y],
        },
      });
    }
  }, 400);
  // const selectedEntities = getSelectedIds();
  const shouldDisableDuplicateButton = selectedNodes.length !== 1;
  // selectedEntities[0]?.length !== 24 ||

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

        createNode("new", payload);
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
              value={
                currentCategory
                  ? categories?.findIndex(({ id }) => id === selectedCategoryId)
                  : 0
              }
              onChange={handleChange}
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
              <Button
                sx={{
                  mt: "7px",
                  ml: "5px",
                  borderRadius: "0",
                  minHeight: "30px",
                  border: "1px solid #DDDDDD",
                  backgroundColor: "#F8F8F8",
                  borderBottom: "none",
                  width: "42px",
                  minWidth: "42px",
                }}
                onClick={(e) => {
                  dialogs.open(CategoryFormDialog, { defaultValues: null });
                  e.preventDefault();
                }}
              >
                <Add />
              </Button>
            ) : null}
            <Button
              title={t("label.search_blocks_panel_header")}
              sx={{
                mt: "7px",
                ml: "auto",
                mr: "5px",
                borderRadius: "0",
                minHeight: "30px",
                border: "1px solid #DDDDDD",
                backgroundColor: "#F8F8F8",
                borderBottom: "none",
                width: "42px",
                minWidth: "42px",
              }}
              onClick={(e) => {
                setSearchOpen((prev) => !prev);
                e.preventDefault();
              }}
            >
              <SearchIcon />
            </Button>
          </Grid>
          <Grid container>
            <ButtonGroup
              size="small"
              sx={{
                left: 240,
                top: 140,
                zIndex: 6,
                position: "absolute",
                display: "flex",
                flexDirection: "row",
              }}
            >
              {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    if (selectedBlockId) {
                      openEditDialog(selectedBlockId);
                    }
                  }}
                  disabled={selectedNodes.length !== 1}
                >
                  {t("button.edit")}
                </Button>
              ) : null}
              {hasPermission(EntityType.BLOCK, PermissionAction.UPDATE) ? (
                <Button
                  variant="contained"
                  startIcon={<MoveUp />}
                  onClick={handleMoveButton}
                  disabled={!selectedNodes.length}
                >
                  {t("button.move")}
                </Button>
              ) : null}
              {hasPermission(EntityType.BLOCK, PermissionAction.CREATE) ? (
                <Button
                  variant="contained"
                  startIcon={<ContentCopyRounded />}
                  onClick={() => createNode("duplicate")}
                  disabled={shouldDisableDuplicateButton}
                >
                  {t("button.duplicate")}
                </Button>
              ) : null}
              {hasPermission(EntityType.BLOCK, PermissionAction.DELETE) ? (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<DeleteIcon />}
                  onClick={() =>
                    openDeleteDialog(selectedNodes.map(({ id }) => id))
                  }
                  disabled={!selectedNodes.length}
                >
                  {t("button.remove")}
                </Button>
              ) : null}
            </ButtonGroup>
          </Grid>
        </Grid>
      </Box>
      <Box
        position="relative"
        height="100%"
        ref={canvasRef}
        onKeyDown={handleKeyDown}
      >
        {currentCategory ? (
          <ReactFlowWrapper
            defaultEdges={links}
            defaultNodes={nodes}
            defaultViewport={{
              x: currentCategory?.offset?.[0] || 0,
              y: currentCategory?.offset?.[1] || 0,
              zoom: currentCategory?.zoom || 1,
            }}
            onMoveNode={debouncedUpdateBlock}
            onViewport={debouncedUpdateCategory}
            onDeleteNodes={openDeleteDialog}
            onNodeDoubleClick={openEditDialog}
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
