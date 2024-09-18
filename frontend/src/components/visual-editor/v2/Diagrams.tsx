/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Add } from "@mui/icons-material";
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
  debounce,
  tabsClasses,
} from "@mui/material";
import {
  DefaultLinkModel,
  DefaultPortModel,
  DiagramEngine,
  DiagramModel,
  DiagramModelGenerics,
} from "@projectstorm/react-diagrams";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DeleteDialog } from "@/app-components/dialogs";
import { CategoryDialog } from "@/components/categories/CategoryDialog";
import { useDelete, useDeleteFromCache } from "@/hooks/crud/useDelete";
import { useFind } from "@/hooks/crud/useFind";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdate, useUpdateCache } from "@/hooks/crud/useUpdate";
import { getDisplayDialogs, useDialog } from "@/hooks/useDialog";
import { useSearch } from "@/hooks/useSearch";
import { EntityType, Format } from "@/services/types";
import { IBlock } from "@/types/block.types";
import { ICategory } from "@/types/category.types";
import { BlockPorts } from "@/types/visual-editor.types";

import BlockDialog from "../BlockDialog";
import { ZOOM_LEVEL } from "../constants";
import { useVisualEditor } from "../hooks/useVisualEditor";

const Diagrams = () => {
  const { t } = useTranslation();
  const [model, setModel] = useState<
    DiagramModel<DiagramModelGenerics> | undefined
  >();
  const [engine, setEngine] = useState<DiagramEngine | undefined>();
  const [canvas, setCanvas] = useState<JSX.Element | undefined>();
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const deleteDialogCtl = useDialog<string>(false);
  const addCategoryDialogCtl = useDialog<ICategory>(false);
  const {
    buildDiagram,
    setViewerZoom,
    setViewerOffset,
    setSelectedCategoryId,
    selectedCategoryId,
    createNode,
  } = useVisualEditor();
  const editDialogCtl = useDialog<IBlock>(false);
  const { searchPayload } = useSearch<IBlock>({
    $eq: [{ category: selectedCategoryId }],
  });
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
    {
      onSuccess([{ id, zoom, offset }]) {
        if (id) {
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
  const { mutateAsync: updateCategory } = useUpdate(EntityType.CATEGORY, {
    invalidate: false,
  });
  const { mutateAsync: deleteBlock } = useDelete(EntityType.BLOCK, {
    onSuccess() {
      deleteDialogCtl.closeDialog();
      setSelectedBlockId(undefined);
    },
    invalidate: false,
  });
  const { mutateAsync: updateBlock } = useUpdate(EntityType.BLOCK, {
    invalidate: false,
  });
  const debouncedZoomEvent = debounce((event) => {
    if (selectedCategoryId) {
      engine?.repaintCanvas();
      updateCategory({
        id: selectedCategoryId,
        params: {
          zoom: event.zoom,
        },
      });
    }
    event.stopPropagation();
  }, 200);
  const debouncedOffsetEvent = debounce((event) => {
    if (selectedCategoryId) {
      updateCategory({
        id: selectedCategoryId,
        params: {
          offset: [event.offsetX, event.offsetY],
        },
      });
    }
    event.stopPropagation();
  }, 200);
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const updateCachedBlock = useUpdateCache(EntityType.BLOCK);
  const deleteCachedBlock = useDeleteFromCache(EntityType.BLOCK);
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    if (categories) {
      const { id } = categories[newValue];

      if (id) {
        setSelectedCategoryId?.(id);
        setSelectedBlockId(undefined); // Reset selected block when switching categories, resetting edit & remove buttons
      }
    }
  };
  const { data: blocks } = useFind(
    { entity: EntityType.BLOCK, format: Format.FULL },
    { hasCount: false, params: searchPayload },
    {
      enabled: !!selectedCategoryId,
    },
  );
  const deleteCallbackRef = useRef<() => void | null>(() => {});

  useEffect(() => {
    // Case when categories are already cached
    if (categories?.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, []);

  useEffect(() => {
    const { canvas, model, engine } = buildDiagram({
      zoom: currentCategory?.zoom || 100,
      offset: currentCategory?.offset || [0, 0],
      data: blocks,
      setter: setSelectedBlockId,
      updateFn: updateBlock,
      onRemoveNode: (ids, next) => {
        deleteDialogCtl.openDialog(ids.join(","));
        deleteCallbackRef.current = next;
      },
      onDbClickNode: (event, id) => {
        if (id) {
          const block = getBlockFromCache(id);

          editDialogCtl.openDialog(block);
        }
      },
      targetPortChanged: ({
        entity,
        port,
      }: {
        entity: DefaultLinkModel;
        port: DefaultPortModel;
      }) => {
        const link = model.getLink(entity.getOptions().id as string);

        if (
          !port.getOptions().in ||
          [BlockPorts.nextBlocksOutPort, BlockPorts.attachmentOutPort].includes(
            // @ts-expect-error protected attr
            entity.targetPort.getOptions().label,
          )
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
  }, [JSON.stringify(blocks)]);

  const handleDeleteButton = () => {
    const selectedEntities = engine?.getModel().getSelectedEntities();
    const ids = selectedEntities?.map((model) => model.getID()).join(",");

    if (ids && selectedEntities) {
      deleteCallbackRef.current = () => {
        if (selectedEntities.length > 0) {
          selectedEntities.forEach((model) => {
            model.setLocked(false);
            model.remove();
          });
          engine?.repaintCanvas();
        }
      };
      deleteDialogCtl.openDialog(ids);
    }
  };
  const onDelete = async () => {
    const id = deleteDialogCtl?.data;

    if (id) {
      // Check if it's a link id
      if (id.length === 36) {
        // Remove link + update nextBlocks + TODO update port state
        const link = model?.getLink(id) as any;
        const sourceId = link?.sourcePort.parent.options.id;
        const targetId = link?.targetPort.parent.options.id;

        if (link?.sourcePort.options.label === BlockPorts.nextBlocksOutPort) {
          // Next/previous Link Delete
          const previousData = getBlockFromCache(sourceId);
          const nextBlocks = [...(previousData?.nextBlocks || [])];

          await updateBlock(
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
                      (previousBlock) => previousBlock !== sourceId,
                    ),
                  }),
                });
              },
            },
          );
        } else if (
          link?.sourcePort.options.label === BlockPorts.attachmentOutPort
        ) {
          // Attached / AttachedTo Link Delete
          await updateBlock(
            {
              id: sourceId,
              params: {
                attachedBlock: null,
              },
            },
            {
              onSuccess() {
                updateCachedBlock({
                  id: targetId,
                  preprocess: (oldData) => ({
                    ...oldData,
                    attachedToBlock: null,
                  }),
                });
              },
            },
          );
        }
      } else {
        // Block Delete Case
        const ids = id.includes(",") ? id.split(",") : [id];
        const deletePromises = ids.map((id) => {
          const block = getBlockFromCache(id);

          return deleteBlock(id, {
            onSuccess() {
              // Update all linked blocks to remove any reference to the deleted block
              [
                ...(block?.nextBlocks || []),
                ...(block?.previousBlocks || []),
                ...(block?.attachedBlock ? [block.attachedBlock] : []),
                ...(block?.attachedToBlock ? [block.attachedToBlock] : []),
              ]
                .map((bid) => getBlockFromCache(bid))
                .filter((b) => !!b)
                .forEach((b) => {
                  updateCachedBlock({
                    id: b.id,
                    payload: {
                      ...b,
                      nextBlocks: b.nextBlocks?.filter(
                        (nextBlockId) => nextBlockId !== id,
                      ),
                      previousBlocks: b.previousBlocks?.filter(
                        (previousBlockId) => previousBlockId !== id,
                      ),
                      attachedBlock:
                        b.attachedBlock === id ? undefined : b.attachedBlock,
                      attachedToBlock:
                        b.attachedToBlock === id
                          ? undefined
                          : b.attachedToBlock,
                    },
                    strategy: "overwrite",
                  });
                });

              deleteCachedBlock(id);
            },
          });
        });

        await Promise.all(deletePromises);
      }

      deleteCallbackRef.current?.();
      deleteCallbackRef.current = () => {};
      deleteDialogCtl.closeDialog();
    }
  };

  return (
    <div
      className="visual-editor"
      id="visual-editor"
      onDrop={(event) => {
        const data = JSON.parse(
          event.dataTransfer.getData("storm-diagram-node"),
        );

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
        <CategoryDialog {...getDisplayDialogs(addCategoryDialogCtl)} />
        <BlockDialog {...getDisplayDialogs(editDialogCtl)} />
        <DeleteDialog {...deleteDialogCtl} callback={onDelete} />
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
              }}
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
                addCategoryDialogCtl.openDialog();
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
                    const block = getBlockFromCache(selectedBlockId);

                    editDialogCtl.openDialog(block);
                  }
                }}
                disabled={!selectedBlockId || selectedBlockId.length !== 24}
              >
                {t("button.edit")}
              </Button>
              <Button
                sx={{}}
                size="small"
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteButton}
                disabled={!selectedBlockId}
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
