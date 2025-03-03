/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  DiagramEngine,
  DiagramModel,
  DiagramModelGenerics,
  NodeModel,
} from "@projectstorm/react-diagrams";
import { ReactNode } from "react";

import { CustomDeleteItemsActionOptions } from "@/components/visual-editor/v2/CustomDiagramNodes/CustomDeleteAction";

import { IBlock } from "./block.types";

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
  onDbClickNode?: (event?: any, id?: string) => void;
  onRemoveNode?: CustomDeleteItemsActionOptions["callback"];
  linkChangeHandler?: (event: any) => void;
  targetPortChanged?: (event: any) => void;
}
export interface IVisualEditorContext {
  addNode: (payload: any) => NodeModel;
  createNode: (payload: any) => void;
  buildDiagram: (props: IVisualEditor) => {
    model: DiagramModel<DiagramModelGenerics>;
    engine: DiagramEngine;
    canvas: React.JSX.Element;
  };
  setViewerZoom: (zoom: number) => void;
  setViewerOffset: ([x, y]: [number, number]) => void;
  setSelectedCategoryId: (id: string) => void;
  selectedCategoryId: string;
}

export interface VisualEditorContextProps {
  children: ReactNode;
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
