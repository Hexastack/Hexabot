/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MarkerType } from "@xyflow/react";
import { FC } from "react";

import AttachmentIcon from "@/app-components/svg/toolbar/AttachmentIcon";
import ButtonsIcon from "@/app-components/svg/toolbar/ButtonsIcon";
import ListIcon from "@/app-components/svg/toolbar/ListIcon";
import PluginIcon from "@/app-components/svg/toolbar/PluginIcon";
import QuickRepliesIcon from "@/app-components/svg/toolbar/QuickRepliesIcon";
import SimpleTextIcon from "@/app-components/svg/toolbar/SimpleTextIcon";
import { IBlock, IBlockFull } from "@/types/block.types";
import { getBlockType } from "@/utils/block";
import { generateId } from "@/utils/generateId";

import {
  EdgeLink,
  LinkType,
  NodeData,
  TBlock,
} from "../types/visual-editor.types";

export const determineCase = (blockMessage: IBlockFull["message"]) => {
  if (typeof blockMessage === "string" || Array.isArray(blockMessage))
    return "text";
  if ("attachment" in blockMessage) return "attachment";
  if ("quickReplies" in blockMessage) return "quickReplies";
  if ("buttons" in blockMessage) return "buttons";
  if ("elements" in blockMessage) return "list";

  return "plugin";
};
export const getBlockConfig = (
  blockMessage: IBlockFull["message"],
): { type: TBlock; color: string; Icon: FC<React.SVGProps<SVGSVGElement>> } => {
  const type = determineCase(blockMessage) as TBlock;

  return { type, ...getBlockConfigByType(type) };
};

export const getBlockConfigByType = (
  type: TBlock,
): { color: string; Icon: FC<React.SVGProps<SVGSVGElement>> } => {
  switch (type) {
    case "text":
      return { color: "#009185", Icon: SimpleTextIcon };
    case "attachment":
      return { color: "#e6a23c", Icon: AttachmentIcon };
    case "quickReplies":
      return { color: "#a80551", Icon: QuickRepliesIcon };
    case "buttons":
      return { color: "#570063", Icon: ButtonsIcon };
    case "list":
      return { color: "#108aa8", Icon: ListIcon };
    case "plugin":
      return { color: "#a8ba33", Icon: PluginIcon };
    default:
      throw new Error("Unexpected case");
  }
};

export const getStartNode = (block: IBlock): NodeData => {
  return {
    id: `startPoint-${block.id}`,
    position: { x: block.position.x - 250, y: block.position.y + 50 },
    data: {
      type: getBlockType(block.message),
      title: block.name,
      message: block.message as any,
      starts_conversation: block.starts_conversation,
      patterns: block.patterns,
      nodeType: "virtualBlock",
    },
    type: "block",
    draggable: false,
    focusable: false,
    selectable: false,
  };
};

export const getStartEdges = (blocks: IBlock[]): EdgeLink[] => {
  return blocks
    .filter((b) => b.starts_conversation)
    .map((b) => ({
      id: generateId(),
      source: `startPoint-${b.id}`,
      target: b.id,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#555" },
      style: { stroke: "#555", strokeWidth: "3px" },
      type: "edgeWithButton",
      sourceHandle: LinkType.NEXT_BLOCKS,
    }));
};

export const getNodesFromBlocks = (blocks: IBlock[]): NodeData[] => {
  const nodes: NodeData[] = [];

  blocks.forEach((b) => {
    if (b.starts_conversation) {
      nodes.push(getStartNode(b));
    }

    nodes.push({
      id: b.id,
      position: b.position,
      data: {
        type: getBlockType(b.message),
        title: b.name,
        message: b.message as any,
        starts_conversation: b.starts_conversation,
        patterns: b.patterns,
      },
      type: "block",
    });
  });

  return nodes;
};

export const getNextBlocksEdges = (blocks: IBlock[]): EdgeLink[] => {
  return blocks
    .filter((b) => b.nextBlocks?.length)
    .flatMap(
      (b) =>
        b.nextBlocks?.map((id) => ({
          id: generateId(),
          source: b.id,
          target: id,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#555" },
          style: { stroke: "#555", strokeWidth: "3px" },
          type: "edgeWithButton",
          sourceHandle: LinkType.NEXT_BLOCKS,
        })) as EdgeLink[],
    );
};

export const getAttachedEdges = (blocks: IBlock[]): EdgeLink[] => {
  return blocks
    .filter((b) => b.attachedBlock)
    .map(
      (b) =>
        ({
          id: generateId(),
          source: b.id,
          target: b.attachedBlock,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#019185" },
          style: { stroke: "#019185", strokeWidth: "3px" },
          type: "edgeWithButton",
          sourceHandle: LinkType.ATTACHED,
        } as EdgeLink),
    );
};

export const updateEdgeSvgStyle = (
  target: EventTarget,
  property: keyof CSSStyleDeclaration,
  value: string,
) => {
  if (!(target instanceof Element)) {
    return;
  }

  const svg = target.closest("svg");

  if (svg) {
    svg.style[property.toString()] = value;
  }
};

export const updateEdgeButtonStyle = (
  id: string,
  property: keyof CSSStyleDeclaration,
  value: string,
) => {
  const button = document.querySelector<HTMLDivElement>(
    `[data-link-id='${id}']`,
  );

  if (button) {
    button.style[property.toString()] = value;
  }
};
