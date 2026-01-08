/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext } from "react";

import { IWorkflowContext } from "../types/workflow.types";

export const WorkflowContext = createContext<IWorkflowContext | null>(null);
