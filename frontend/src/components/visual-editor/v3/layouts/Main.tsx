/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Box, debounce, styled } from "@mui/material";
import { useReactFlow, Viewport } from "@xyflow/react";
import {
  DragEvent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useSearch } from "@/hooks/useSearch";
import { EntityType, Format } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";

import { BlockSearchPanel } from "../components/main/BlockSearchPanel";
import { BulkButtonsGroup } from "../components/main/BulkButtonsGroup";
import { FlowsTabs } from "../components/main/FlowsTabs";
import { ReactFlowWrapper } from "../components/main/ReactFlowWrapper";
import { useCreateBlock } from "../hooks/useCreateBlocks";
import { useVisualEditor } from "../hooks/useVisualEditor";
import { INodeAttributes, TCb } from "../types/visual-editor.types";
import {
  getAttachedEdges,
  getNextBlocksEdges,
  getNodesFromBlocks,
  getStartEdges,
} from "../utils/block.utils";

const StyledBox = styled(Box)(() => ({
  position: "relative",
  height: "100%",
}));

export const Main = () => {
  const router = useAppRouter();
  const { screenToFlowPosition, setViewport, setNodes, setEdges } =
    useReactFlow();
  const { selectedCategoryId, setSelectedCategoryId, setSelectedNodeIds } =
    useVisualEditor();
  const { createNode } = useCreateBlock();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const { searchPayload } = useSearch<EntityType.BLOCK>({
    $eq: [{ category: selectedCategoryId }],
  });
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
  );
  const { mutate: updateCategory } = useUpdate(EntityType.CATEGORY);
  const { mutate: updateBlock } = useUpdate(EntityType.BLOCK);
  const { data: blocks } = useFind(
    { entity: EntityType.BLOCK, format: Format.FULL },
    { hasCount: false, params: searchPayload },
    {
      enabled: !!selectedCategoryId,
      keepPreviousData: true,
    },
  );
  const startEdges = useMemo(
    () => getStartEdges(blocks),
    [JSON.stringify(blocks.map((b) => b.starts_conversation))],
  );
  const nextBlocksEdges = useMemo(
    () => getNextBlocksEdges(blocks),
    [JSON.stringify(blocks.map((b) => b.nextBlocks))],
  );
  const attachedEdges = useMemo(
    () => getAttachedEdges(blocks),
    [JSON.stringify(blocks.map((b) => b.attachedBlock))],
  );
  const nodes = useMemo(
    () => getNodesFromBlocks(blocks),
    [
      JSON.stringify(blocks.map((b) => b.starts_conversation)),
      JSON.stringify(
        blocks.map((b) => {
          return {
            ...b,
            position: undefined,
            updatedAt: undefined,
            previousBlocks: undefined,
            attachedToBlock: undefined,
            attachedBlock: undefined,
            nextBlocks: undefined,
          };
        }),
      ),
    ],
  );
  const currentCategory = useMemo(() => {
    return categories.find(({ id }) => id === selectedCategoryId);
  }, [categories, selectedCategoryId]);
  const defaultViewport = useMemo(() => {
    if (currentCategory) {
      const { offset = [0, 0], zoom = 1 } = currentCategory;

      return {
        x: offset?.[0],
        y: offset?.[1],
        zoom: zoom > 4 ? zoom / 100 : zoom,
      };
    }

    setNodes([]);
    setEdges([]);

    return {
      x: 0,
      y: 0,
      zoom: 1,
    };
  }, [currentCategory]);
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      const isCmdF = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f";

      if (isCmdF) {
        e.preventDefault();
        setSearchOpen(true);
      }
    },
    [],
  );
  const handleUpdateBlock: TCb<INodeAttributes> = useCallback(
    debounce(({ id, ...rest }) => {
      updateBlock({
        id,
        params: {
          ...rest,
        },
      });
    }, 400),
    [updateBlock],
  );
  const handleUpdateCategory: TCb<Viewport> = useCallback(
    debounce(({ zoom, x, y }) => {
      if (selectedCategoryId) {
        updateCategory({
          id: selectedCategoryId,
          params: {
            zoom: zoom < 4 ? zoom * 100 : zoom,
            offset: [x, y],
          },
        });
      }
    }, 400),
    [updateCategory, selectedCategoryId],
  );
  const dropHandler = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const diagramNode = event.dataTransfer.getData("diagram-node");

      if (!diagramNode) return;

      let data: IBlockAttributes;

      try {
        data = JSON.parse(diagramNode);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Invalid JSON in drop event", error);

        return;
      }

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
    },
    [createNode, screenToFlowPosition, selectedCategoryId],
  );

  useEffect(() => {
    const rawFlowId = router.query.id;
    const flowId = Array.isArray(rawFlowId) ? rawFlowId.at(-1) : rawFlowId;

    if (flowId) {
      setSelectedCategoryId(flowId);
    } else if (categories.length) {
      setSelectedCategoryId(categories[0].id);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.id, categories]);

  useEffect(() => {
    setViewport(defaultViewport);
  }, [currentCategory?.id]);

  useEffect(() => {
    const blockIdsParam = router.query.blockIds;
    const blockIds =
      typeof blockIdsParam === "string"
        ? blockIdsParam
        : Array.isArray(blockIdsParam)
          ? blockIdsParam.at(-1)
          : undefined;

    if (!blockIds) {
      setSelectedNodeIds([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.blockIds, setSelectedNodeIds]);

  useEffect(() => {
    return () => {
      handleUpdateBlock.clear();
    };
  }, [handleUpdateBlock]);

  useEffect(() => {
    return () => {
      handleUpdateCategory.clear();
    };
  }, [handleUpdateCategory]);

  return (
    <div
      onDrop={dropHandler}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      className="visual-editor"
    >
      <FlowsTabs
        onSearchClick={(e) => {
          setSearchOpen((prev) => !prev);
          e.preventDefault();
        }}
      />
      <BulkButtonsGroup />
      <StyledBox ref={canvasRef} onKeyDown={handleKeyDown}>
        {currentCategory ? (
          <ReactFlowWrapper
            onUpdateNode={handleUpdateBlock}
            onViewport={handleUpdateCategory}
            defaultEdges={[...startEdges, ...nextBlocksEdges, ...attachedEdges]}
            defaultNodes={nodes}
            defaultViewport={defaultViewport}
          />
        ) : null}
        <BlockSearchPanel
          canvasRef={canvasRef}
          open={isSearchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </StyledBox>
    </div>
  );
};
