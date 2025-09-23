/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Edge, Node, ReactFlowInstance, XYPosition } from "@xyflow/react";
import { ReactNode } from "react";

import { IBlock, IBlockAttributes } from "@/types/block.types";

export enum BlockPorts {
  inPort = "In",
  nextBlocksOutPort = "Out",
  attachmentOutPort = "Out2",
}

export interface IVisualEditor {
  zoom?: number;
  offset?: [number, number];
  data?: IBlock[];
  setter?: React.Dispatch<React.SetStateAction<string | undefined>>;
  //TODO: type need to be updated
  updateFn?: any;
  onDbClickNode?: (id?: string) => void;
  // onRemoveNode?: CustomDeleteItemsActionOptions["callback"];
  linkChangeHandler?: (event: any) => void;
  targetPortChanged?: (event: any) => void;
  selectedBlockId: string | undefined;
}
export interface IVisualEditorContext extends ReactFlowInstance<Node, Edge> {
  setSelectedCategoryId: (id: string) => void;
  selectedCategoryId: string | undefined;
  nodes: Node[];
  edges: Edge[];

  selectedNodes: Node[];
  setSelectedNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  selectedEdges: Edge[];
  setSelectedEdges: React.Dispatch<React.SetStateAction<Edge[]>>;

  createNode: (role: "new" | "duplicate", props?: IBlockAttributes) => void;
  getCentroid: () => XYPosition;
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
