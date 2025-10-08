/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Cancelable } from "@mui/utils/debounce";
import { Edge, Node, XYPosition } from "@xyflow/react";
import { Dispatch, ReactNode, SetStateAction } from "react";

import {
  BlockType,
  IBlock,
  IBlockAttributes,
  Pattern,
} from "@/types/block.types";

export enum PortType {
  TARGET = "target",
  SOURCE = "source",
}

export enum LinkType {
  ATTACHED = "attached",
  NEXT_BLOCKS = "nextBlocks",
}

export interface IVisualEditorContext {
  getCentroid: () => XYPosition;
  selectNodes: (nodeIds: string[]) => void;
  selectedNodeIds: string[];
  getBlockFromCache: (id: string) => IBlock | undefined;
  selectedCategoryId: string | undefined;
  setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
  setSelectedCategoryId: (id: string) => void;
  toFocusIds: string[];
  setToFocusIds: Dispatch<SetStateAction<string[]>>;
  openSearchPanel: boolean;
  setOpenSearchPanel: Dispatch<SetStateAction<boolean>>;
  updateCachePreviousBlocks: (
    operation: "add" | "del",
    source: string,
    target: string,
  ) => void;
}

export interface VisualEditorContextProps {
  children: ReactNode;
  defaultNodes?: Node[];
}

export enum BlockTypes {
  text = "text",
  attachment = "attachment",
  quickReplies = "quickReplies",
  buttons = "buttons",
  list = "list",
  plugin = "plugin",
}

export type TBlock = keyof typeof BlockTypes;

export type EdgeLink = Edge & { id: string; source: string; target: string };

export type NodeBlockData = {
  type: BlockType;
  title: string;
  message: string | string[];
  starts_conversation?: boolean;
  patterns?: Pattern[];
  nodeType?: string;
};

export type NodeData = Node<NodeBlockData>;
export interface INodeAttributes extends Partial<IBlockAttributes> {
  id: string;
}

export type TCb<T> = ((props: T) => void | undefined) & Cancelable;
