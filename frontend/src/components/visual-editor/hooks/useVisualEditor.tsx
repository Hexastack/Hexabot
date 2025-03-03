/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { debounce } from "@mui/material";
import createEngine, { DiagramModel } from "@projectstorm/react-diagrams";
import * as React from "react";
import { createContext, useContext } from "react";

import { useCreate } from "@/hooks/crud/useCreate";
import { EntityType } from "@/services/types";
import { IBlock } from "@/types/block.types";
import {
  BlockPorts,
  IVisualEditor,
  IVisualEditorContext,
  VisualEditorContextProps,
} from "@/types/visual-editor.types";

import { ZOOM_LEVEL } from "../constants";
import { AdvancedLinkFactory } from "../v2/AdvancedLink/AdvancedLinkFactory";
import { AdvancedLinkModel } from "../v2/AdvancedLink/AdvancedLinkModel";
import { CustomCanvasWidget } from "../v2/CustomCanvasWidget";
import { CustomDeleteItemsAction } from "../v2/CustomDiagramNodes/CustomDeleteAction";
import { NodeFactory } from "../v2/CustomDiagramNodes/NodeFactory";
import { NodeModel } from "../v2/CustomDiagramNodes/NodeModel";
import { BLOCK_HEIGHT, BLOCK_WIDTH } from "../v2/CustomDiagramNodes/NodeWidget";

const engine = createEngine({ registerDefaultDeleteItemsAction: false });
let model: DiagramModel;

const addNode = (block: IBlock) => {
  const node = new NodeModel({
    id: block.id,
    // @ts-ignore
    title: block.name,
    content: " ",
    patterns: (block?.patterns || [""]) as any,
    message: (block?.message || [""]) as any,
    starts_conversation: !!block?.starts_conversation,
  });

  node.setPosition(block.position.x, block.position.y);
  model.addNode(node);
  engine.setModel(model);

  return node;
};
const getCentroid = () => {
  if (document) {
    const diagramElement = document.getElementById("visual-editor");

    if (diagramElement) {
      const rect = diagramElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const offsetX = BLOCK_WIDTH / 2;
      const offsetY = BLOCK_HEIGHT / 2;
      const position = engine.getRelativeMousePoint({
        clientX: x,
        clientY: y,
      });

      return { x: position.x - offsetX, y: position.y - offsetY };
    }
  }

  return { x: 0, y: 0 };
};
const buildDiagram = ({
  zoom,
  offset,
  data,
  setter,
  updateFn,
  onRemoveNode,
  onDbClickNode,
  targetPortChanged,
}: IVisualEditor) => {
  window["customEvents"] = {};
  model = new DiagramModel();

  engine.getNodeFactories().registerFactory(new NodeFactory());
  engine.getLinkFactories().registerFactory(new AdvancedLinkFactory());

  engine
    .getActionEventBus()
    .registerAction(new CustomDeleteItemsAction({ callback: onRemoveNode }));
  if (offset) setViewerOffset(offset);
  if (zoom) setViewerZoom(zoom);

  if (data?.length) {
    const nodes = data
      .filter((datum) => !!datum)
      .map((datum) => {
        const node = addNode(datum);

        if (!!datum.attachedBlock) {
          node.getPort(BlockPorts.nextBlocksOutPort)?.setLocked(true);
        }
        if (Array.isArray(datum.nextBlocks) && datum.nextBlocks.length > 0) {
          node.getPort(BlockPorts.attachmentOutPort)?.setLocked(true);
        }

        node.setPosition(datum.position.x, datum.position.y);

        return node;
      });
    const selectionHandler = (event: any) => {
      const { entity, isSelected } = event;
      const eventType = entity.parent.options.type;
      const nodeId = entity.options.id;
      const selector = document?.querySelector(`[data-nodeid='${nodeId}']`);

      if (eventType === "diagram-nodes") {
        if (isSelected === true) {
          setter?.(nodeId);
          model.getNode(nodeId).setSelected(true);

          if (!window["customEvents"][`dblclickEventNode${nodeId}Added`])
            selector?.addEventListener("dblclick", (e) => {
              onDbClickNode?.(e, nodeId);
              window["customEvents"][`dblclickEventNode${nodeId}Added`] = true;
            });
        } else {
          setter?.(undefined);
          selector?.removeEventListener("dblclick", () => {}, true);
          model.getNode(nodeId).setSelected(false);
        }
      } else if (eventType === "diagram-links") {
        if (isSelected === true) {
          setter?.(entity.options.id);
        } else {
          setter?.(undefined);
        }
      }
    };
    const links: AdvancedLinkModel[] = [];

    data.forEach((datum, index) => {
      if ("nextBlocks" in datum && Array.isArray(datum.nextBlocks)) {
        datum.nextBlocks?.forEach((nextBlock) => {
          const link = new AdvancedLinkModel();
          const sourceNode = nodes[index];
          const targetNode = nodes.find(
            // @ts-ignore
            (node) => node.options.id === nextBlock,
          );

          if (sourceNode && targetNode) {
            link.setSourcePort(
              sourceNode.getPort(BlockPorts.nextBlocksOutPort),
            );
            link.setTargetPort(targetNode.getPort(BlockPorts.inPort));
            link.setLocked(true);
            links.push(link);
          }
        });
      }

      //recursive link
      if ("attachedBlock" in datum && datum.attachedBlock) {
        const link = new AdvancedLinkModel({
          color: "#019185",
          selectedColor: "#019185",
          type: "default",
        });
        const sourceNode = nodes[index];
        // @ts-ignore
        const targetNode = nodes.find(
          // @ts-ignore
          (node) => node.options.id === datum.attachedBlock,
        );

        if (sourceNode && targetNode) {
          link.setSourcePort(sourceNode.getPort(BlockPorts.attachmentOutPort));
          link.setTargetPort(targetNode.getPort(BlockPorts.inPort));
          link.setLocked(true);
          links.push(link);
        }
      }
    });

    const models = model.addAll(...nodes, ...links);
    const debouncedUpdate = debounce((event) => {
      updateFn({
        id: event.entity.options.id,
        params: {
          position: event.entity.position,
        },
      });
    }, 400);

    models.forEach((item) => {
      item.registerListener({
        positionChanged(e: any) {
          debouncedUpdate(e);
        },
        entityRemoved() {
          setter?.(undefined);
        },
        selectionChanged: selectionHandler,
      });
    });
  }
  model.registerListener({
    linksUpdated(e: any) {
      e.link.registerListener({
        targetPortChanged: (event) => {
          targetPortChanged?.(event);
        },
      });
    },
  });
  engine.setModel(model);

  return {
    model,
    engine,
    canvas: (
      <CustomCanvasWidget className="diagram-container" engine={engine} />
    ),
  };
};
const setViewerZoom = (zoom: number) => {
  const validatedZoom = Math.min(
    Math.max(zoom, ZOOM_LEVEL.minimum),
    ZOOM_LEVEL.maximum,
  );

  model.setZoomLevel(validatedZoom);
  // engine.setModel(model);
};
const setViewerOffset = ([x, y]: [number, number]) => {
  model.setOffset(x, y);
  // engine.setModel(model);
};
const VisualEditorContext = createContext<IVisualEditorContext>({
  addNode,
  buildDiagram,
  setViewerZoom,
  setViewerOffset,
  createNode: async (): Promise<IBlock> => ({} as IBlock),
  selectedCategoryId: "",
  setSelectedCategoryId: () => {},
});
const VisualEditorProvider: React.FC<VisualEditorContextProps> = ({
  children,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const { mutate: createBlock } = useCreate(EntityType.BLOCK);
  const createNode = (payload: any) => {
    payload.position = payload.position || getCentroid();
    payload.category = payload.category || selectedCategoryId;

    return createBlock(payload, {
      onSuccess({ id }) {
        addNode({
          ...payload,
          id,
        });
      },
    });
  };

  return (
    <VisualEditorContext.Provider
      value={{
        addNode,
        createNode,
        buildDiagram,
        setViewerZoom,
        setViewerOffset,
        setSelectedCategoryId,
        selectedCategoryId,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};

export default VisualEditorProvider;

export const useVisualEditor = (): IVisualEditorContext => {
  const context = useContext(VisualEditorContext);

  if (!context) {
    throw new Error(
      "useVisualEditor must be used within an VisualEditorContext",
    );
  }

  return context;
};
