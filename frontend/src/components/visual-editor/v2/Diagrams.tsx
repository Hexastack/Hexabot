/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Add, ContentCopyRounded, MoveUp } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  Tab,
  Tabs,
  Tooltip,
  tabsClasses,
} from "@mui/material";
import {
  DefaultPortModel,
  DiagramEngine,
  DiagramModel,
  DiagramModelGenerics,
} from "@projectstorm/react-diagrams";
import { useRouter } from "next/router";
import { SyntheticEvent, useCallback, useEffect, useState } from "react";
import { useQueryClient } from "react-query";

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { BlockMoveFormDialog } from "@/components/visual-editor/BlockMoveFormDialog";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useCreate } from "@/hooks/crud/useCreate";
import { useDeleteFromCache } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate, useUpdateCache } from "@/hooks/crud/useUpdate";
import { useUpdateMany } from "@/hooks/crud/useUpdateMany";
import useDebouncedUpdate from "@/hooks/useDebouncedUpdate";
import { useDialogs } from "@/hooks/useDialogs";
import { useSearch } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format, QueryType, RouterType } from "@/services/types";
import { IBlock } from "@/types/block.types";
import { BlockPorts } from "@/types/visual-editor.types";

import { BlockEditFormDialog } from "../BlockEditFormDialog";
import { ZOOM_LEVEL } from "../constants";
import { useVisualEditor } from "../hooks/useVisualEditor";

import { AdvancedLinkModel } from "./AdvancedLink/AdvancedLinkModel";

const Diagrams = () => {
  const { t } = useTranslate();
  const router = useRouter();
  const flowId = router.query.id?.toString();
  const [model, setModel] = useState<
    DiagramModel<DiagramModelGenerics> | undefined
  >();
  const [engine, setEngine] = useState<DiagramEngine | undefined>();
  const [canvas, setCanvas] = useState<JSX.Element | undefined>();
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const dialogs = useDialogs();
  const { mutate: updateBlocks } = useUpdateMany(EntityType.BLOCK);
  const {
    buildDiagram,
    setViewerZoom,
    setViewerOffset,
    setSelectedCategoryId,
    selectedCategoryId,
    createNode,
  } = useVisualEditor();
  const { searchPayload } = useSearch<IBlock>({
    $eq: [{ category: selectedCategoryId }],
  });
  const { toast } = useToast();
  const { mutate: duplicateBlock, isLoading: isDuplicatingBlock } = useCreate(
    EntityType.BLOCK,
    {
      onError: () => {
        toast.error(t("message.duplicate_block_error"));
      },
    },
  );
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
    {
      onSuccess(categories) {
        const { id, zoom, offset } = categories[0] || {};

        if (flowId) {
          setSelectedCategoryId?.(flowId);
        } else if (id) {
          setSelectedCategoryId?.(id);
          if (engine?.getModel()) {
            setViewerOffset(offset || [0, 0]);
            setViewerZoom(zoom || 100);
          }
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
  });
  const { mutate: updateBlock } = useUpdate(EntityType.BLOCK, {
    invalidate: false,
  });
  const debouncedUpdateCategory = useDebouncedUpdate(updateCategory, 300);
  const debouncedZoomEvent = useCallback(
    (event: any) => {
      if (selectedCategoryId) {
        engine?.repaintCanvas();
        debouncedUpdateCategory({
          id: selectedCategoryId,
          params: {
            zoom: event.zoom,
          },
        });
      }
      event.stopPropagation();
    },
    [selectedCategoryId, engine, debouncedUpdateCategory],
  );
  const debouncedOffsetEvent = useCallback(
    (event: any) => {
      if (selectedCategoryId) {
        debouncedUpdateCategory({
          id: selectedCategoryId,
          params: {
            offset: [event.offsetX, event.offsetY],
          },
        });
      }
      event.stopPropagation();
    },
    [selectedCategoryId, debouncedUpdateCategory],
  );
  const queryClient = useQueryClient();
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const updateCachedBlock = useUpdateCache(EntityType.BLOCK);
  const deleteCachedBlock = useDeleteFromCache(EntityType.BLOCK);
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
  const handleDuplicateBlock = () => {
    const block = getBlockFromCache(selectedEntities[0]);

    if (!block) {
      return;
    }
    const {
      attachedBlock: _attachedBlock,
      nextBlocks: _nextBlocks,
      previousBlocks: _previousBlocks,
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      position,
      ...duplicateBlockDto
    } = block;

    duplicateBlock({
      ...duplicateBlockDto,
      name: `${block.name} (Copy)`,
      position: {
        x: position.x + 100,
        y: position.y + 100,
      },
    });
  };

  useEffect(() => {
    // Case when categories are already cached
    if (categories?.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (flowId) setSelectedCategoryId(flowId);
    else if (categories?.length) setSelectedCategoryId(categories[0].id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  useEffect(() => {
    const { canvas, model, engine } = buildDiagram({
      zoom: currentCategory?.zoom || 100,
      offset: currentCategory?.offset || [0, 0],
      data: blocks,
      setter: setSelectedBlockId,
      updateFn: updateBlock,
      onRemoveNode: openDeleteDialog,
      onDbClickNode: (event, id) => {
        if (id) {
          openEditDialog(id);
        }
      },
      targetPortChanged: ({
        entity,
        port,
      }: {
        entity: AdvancedLinkModel;
        port: DefaultPortModel;
      }) => {
        const link = model.getLink(entity.getOptions().id as string);

        if (!link) return;

        if (
          !port.getOptions().in ||
          [BlockPorts.nextBlocksOutPort, BlockPorts.attachmentOutPort].includes(
            // @ts-expect-error protected attr
            entity.targetPort.getOptions().label,
          ) ||
          (link.getSourcePort().getType() === "attached" &&
            link.getSourcePort().getParent().getOptions().id ===
              link.getTargetPort().getParent().getOptions().id)
        ) {
          model.removeLink(link);

          return;
        }

        link.setLocked(true);
        link.registerListener({
          selectionChanged(event: any) {
            const { entity, isSelected } = event;

            setSelectedBlockId(isSelected === true && entity.options.id);
          },
        });

        Object.entries(port.links).map(([, val]) => {
          // @ts-expect-error protected attr
          if (val.targetPort?.options?.locked) {
            model.removeLink(val);
          }
        });

        const sourceId = entity.getSourcePort().getParent().getOptions()
          .id as string;
        const targetId = entity.getTargetPort().getParent().getOptions()
          .id as string;
        const previousData = getBlockFromCache(sourceId!);

        if (
          // @ts-expect-error undefined attr
          entity.getSourcePort().getOptions()?.label ===
          BlockPorts.nextBlocksOutPort
        ) {
          const nextBlocks = [
            ...(previousData?.nextBlocks || []),
            ...(targetId ? [targetId] : []),
          ];

          updateBlock(
            {
              id: sourceId,
              params: {
                nextBlocks,
              },
            },
            {
              onSuccess(data) {
                if (data.id)
                  updateCachedBlock({
                    id: targetId,
                    payload: {
                      previousBlocks: [data.id as any],
                    },
                  });
              },
            },
          );
        } else if (
          // @ts-expect-error undefined attr
          entity.getSourcePort().getOptions().label ===
          BlockPorts.attachmentOutPort
        ) {
          updateBlock({
            id: sourceId,
            params: {
              attachedBlock: targetId,
            },
          });
        }
      },
    });

    setModel(model);
    setEngine(engine);
    setCanvas(canvas);

    model.registerListener({
      zoomUpdated: debouncedZoomEvent,
      offsetUpdated: debouncedOffsetEvent,
    });
  }, [
    selectedCategoryId,
    JSON.stringify(
      blocks.map((b) => {
        return { ...b, position: undefined, updatedAt: undefined };
      }),
    ),
  ]);

  const handleLinkDeletion = (linkId: string, model: DiagramModel) => {
    const link = model?.getLink(linkId) as any;
    const sourceId = link?.sourcePort.parent.options.id;
    const targetId = link?.targetPort.parent.options.id;

    if (link?.sourcePort.options.label === BlockPorts.nextBlocksOutPort) {
      removeNextBlockLink(sourceId, targetId);
    } else if (
      link?.sourcePort.options.label === BlockPorts.attachmentOutPort
    ) {
      removeAttachedLink(sourceId, targetId);
    }
  };
  const removeNextBlockLink = (sourceId: string, targetId: string) => {
    const previousData = getBlockFromCache(sourceId);
    const nextBlocks = [...(previousData?.nextBlocks || [])];

    updateBlock(
      {
        id: sourceId,
        params: {
          nextBlocks: nextBlocks.filter((block) => block !== targetId),
        },
      },
      {
        onSuccess() {
          updateCachedBlock({
            id: targetId,
            preprocess: ({ previousBlocks = [], ...rest }) => ({
              ...rest,
              previousBlocks: previousBlocks.filter(
                (block) => block !== sourceId,
              ),
            }),
          });
        },
      },
    );
  };
  const removeAttachedLink = (sourceId: string, targetId: string) => {
    updateBlock(
      {
        id: sourceId,
        params: { attachedBlock: null },
      },
      {
        onSuccess() {
          updateCachedBlock({
            id: targetId,
            preprocess: (oldData) => ({ ...oldData, attachedToBlock: null }),
          });
        },
      },
    );
  };
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
  const getSelectedIds = () => {
    const entities = engine?.getModel().getSelectedEntities();
    const ids = entities?.map((model) => model.getID());

    return ids || [];
  };
  const getGroupedIds = (ids: string[]) => {
    return ids.reduce(
      (acc, str) => ({
        ...acc,
        ...(str.length === 36
          ? { linkIds: [...acc.linkIds, str] }
          : { blockIds: [...acc.blockIds, str] }),
      }),
      { linkIds: [] as string[], blockIds: [] as string[] },
    );
  };
  const hasSelectedBlock = () => {
    const ids = getSelectedIds();

    return getGroupedIds(ids).blockIds.length > 0;
  };
  const openDeleteDialog = async () => {
    const ids = getSelectedIds();
    const model = engine?.getModel();

    if (ids.length) {
      const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
        mode: "selection",
        count: ids.length,
        isSingleton: true,
      });

      if (isConfirmed && model) {
        onDelete(ids, model);
      }
    }
  };
  const openEditDialog = (selectedBlockId: string) => {
    const block = getBlockFromCache(selectedBlockId);

    dialogs.open(BlockEditFormDialog, block, {
      maxWidth: "md",
      isSingleton: true,
    });
  };
  const handleMoveButton = () => {
    const ids = getSelectedIds();
    const { blockIds } = getGroupedIds(ids);

    if (ids.length) {
      dialogs.open(BlockMoveFormDialog, {
        ids: blockIds,
        onMove,
        category: selectedCategoryId,
        categories,
      });
    }
  };
  const onDelete = (ids: string[], model: DiagramModel) => {
    if (!ids || ids?.length === 0) {
      return;
    }

    const { linkIds, blockIds } = getGroupedIds(ids);

    if (linkIds.length && !blockIds.length) {
      linkIds.forEach((linkId) => handleLinkDeletion(linkId, model));
    } else if (blockIds.length) {
      handleBlocksDeletion(blockIds);
    }
  };
  const onMove = (ids: string[], targetCategoryId: string) => {
    if (ids.length) {
      updateBlocks(
        { ids, payload: { category: targetCategoryId } },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              predicate: ({ queryKey }) => {
                const [qType, qEntity] = queryKey;

                return (
                  qType === QueryType.collection &&
                  isSameEntity(qEntity, EntityType.BLOCK)
                );
              },
            });

            onCategoryChange(
              categories.findIndex(({ id }) => id === targetCategoryId),
            );
          },
        },
      );
    }
  };
  const selectedEntities = getSelectedIds();
  const shouldDisableDuplicateButton =
    selectedEntities.length !== 1 ||
    selectedEntities[0]?.length !== 24 ||
    isDuplicatingBlock;

  return (
    <div
      className="visual-editor"
      id="visual-editor"
      onDrop={(event) => {
        const stormDiagramNode =
          event.dataTransfer.getData("storm-diagram-node");

        if (!stormDiagramNode) return;
        const data = JSON.parse(stormDiagramNode);

        if (!data) {
          // eslint-disable-next-line no-console
          console.warn("Unable to handle the drop event");

          return;
        }

        const payload = {
          ...data,
          category: selectedCategoryId || "",
          position: engine?.getRelativeMousePoint(event),
        };

        createNode(payload);
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
                dialogs.open(CategoryFormDialog, null);
                e.preventDefault();
              }}
            >
              <Add />
            </Button>
          </Grid>
          <Grid container>
            <Grid
              sx={{
                left: 240,
                top: 140,
                zIndex: 6,
                position: "absolute",
                display: "flex",
                flexDirection: "row",
                gap: "8px",
              }}
            >
              <Button
                sx={{}}
                size="small"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  if (selectedBlockId) {
                    openEditDialog(selectedBlockId);
                  }
                }}
                disabled={getSelectedIds().length > 1 || !hasSelectedBlock()}
              >
                {t("button.edit")}
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<MoveUp />}
                onClick={handleMoveButton}
                disabled={!hasSelectedBlock()}
              >
                {t("button.move")}
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<ContentCopyRounded />}
                onClick={handleDuplicateBlock}
                disabled={shouldDisableDuplicateButton}
              >
                {t("button.duplicate")}
              </Button>
              <Button
                sx={{}}
                size="small"
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => openDeleteDialog()}
                disabled={!getSelectedIds().length}
              >
                {t("button.remove")}
              </Button>
            </Grid>
            <Grid container item justifyContent="right" xs alignSelf="center">
              <ButtonGroup
                orientation="vertical"
                color="inherit"
                variant="contained"
                sx={{
                  left: 240,
                  bottom: 20,
                  zIndex: 6,
                  position: "absolute",
                  transition: "all 0.3s",
                  boxShadow: "0 0 8px #0003",
                  borderRadius: "20px",
                  backgroundColor: "#fffc",
                  "&.MuiButtonGroup-contained:hover": {
                    boxShadow: "0 0 8px #0005",
                  },
                  "& .MuiButton-root": {
                    backgroundColor: "background.paper",
                  },
                }}
              >
                <Tooltip
                  title={t("visual_editor.zoom.reset")}
                  arrow
                  placement="left"
                >
                  <span>
                    <Button
                      sx={{ p: "8px 2px 6px 2px" }}
                      disabled={
                        !!currentCategory?.zoom && currentCategory?.zoom === 100
                      }
                      onClick={() => {
                        setViewerZoom(100);
                      }}
                    >
                      <RestartAltIcon />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title={t("visual_editor.zoom.in")}
                  arrow
                  placement="left"
                >
                  <span>
                    <Button
                      sx={{ p: "6px 2px" }}
                      disabled={
                        !!currentCategory?.zoom &&
                        currentCategory.zoom >= ZOOM_LEVEL.maximum
                      }
                      onClick={() => {
                        if (model) {
                          const currentZoom = model.getZoomLevel();

                          setViewerZoom(currentZoom + ZOOM_LEVEL.step);
                        }
                      }}
                    >
                      <ZoomInIcon />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title={t("visual_editor.zoom.out")}
                  arrow
                  placement="left"
                >
                  <span>
                    <Button
                      sx={{ p: "6px 2px" }}
                      disabled={
                        !!currentCategory?.zoom &&
                        currentCategory?.zoom <= ZOOM_LEVEL.minimum
                      }
                      onClick={() => {
                        if (model) {
                          const currentZoom = model.getZoomLevel();

                          setViewerZoom(currentZoom - ZOOM_LEVEL.step);
                        }
                      }}
                    >
                      <ZoomOutIcon />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title={t("visual_editor.zoom.fitScreen")}
                  arrow
                  placement="left"
                >
                  <span>
                    <Button
                      sx={{ p: "6px 2px 8px 2px" }}
                      onClick={() => {
                        engine?.zoomToFitSelectedNodes({ margin: 0 });
                      }}
                    >
                      <FitScreenIcon />
                    </Button>
                  </span>
                </Tooltip>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      {canvas}
    </div>
  );
};

export default Diagrams;
