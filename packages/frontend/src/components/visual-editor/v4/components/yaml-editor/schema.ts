/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowDefinitionSchema } from "@hexabot-ai/agentic";
import type { JSONSchema } from "monaco-yaml";
import { zodToJsonSchema } from "zod-to-json-schema";

export const WORKFLOW_SCHEMA_URI =
  "inmemory://model/hexabot-workflow.schema.json";

const workflowSchema = zodToJsonSchema(WorkflowDefinitionSchema, {
  name: "HexabotWorkflow",
  target: "jsonSchema7",
});

export const WORKFLOW_YAML_SCHEMA = workflowSchema as JSONSchema;
