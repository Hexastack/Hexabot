/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  extractTaskDefinitions,
  type TaskDefinition,
  type WorkflowDefinition,
} from "@hexabot-ai/agentic";
import type { MemoryDefinition } from "@hexabot-ai/types";

import type {
  GlobalsSchema,
  JsonSchemaLike,
} from "@/app-components/inputs/JsonataFormulaField";
import type { IAction } from "@/types/action.types";
import { isRecord } from "@/utils/object";

type WorkflowTaskDefinition = TaskDefinition;

const MEMORY_BINDING_KIND = "memory";

type BuildJsonataGlobalsSchemaArgs = {
  definition?: WorkflowDefinition;
  taskDefinitions?: Record<string, WorkflowTaskDefinition>;
  actionsByName: ReadonlyMap<string, IAction>;
  memoryDefinitions?: MemoryDefinition[];
  inputSchema?: unknown;
};

const createOpenObjectSchema = (): JsonSchemaLike => ({
  type: "object",
  properties: {},
  additionalProperties: true,
});

export const extractMemoryDefinitionIdsFromWorkflowDefinition = (
  definition?: WorkflowDefinition,
): string[] => {
  if (!definition?.defs) {
    return [];
  }

  const ids = Object.values(definition.defs).reduce<string[]>(
    (acc, defDefinition) => {
      if (!isRecord(defDefinition)) {
        return acc;
      }

      if (defDefinition.kind !== MEMORY_BINDING_KIND) {
        return acc;
      }

      const definitionSettings = isRecord(defDefinition.settings)
        ? defDefinition.settings
        : undefined;
      const definitionId = definitionSettings?.definition_id;

      if (typeof definitionId !== "string" || !definitionId.trim()) {
        return acc;
      }

      acc.push(definitionId);

      return acc;
    },
    [],
  );

  return Array.from(new Set(ids));
};
const isJsonSchemaLike = (schema: unknown): schema is JsonSchemaLike =>
  Boolean(schema) && typeof schema === "object" && !Array.isArray(schema);
const getTaskOutputSchema = ({
  taskDefinition,
  actionsByName,
}: {
  taskDefinition?: WorkflowTaskDefinition;
  actionsByName: ReadonlyMap<string, IAction>;
}): JsonSchemaLike => {
  const actionName = taskDefinition?.action;
  const action = actionName ? actionsByName.get(actionName) : undefined;
  const outputSchema = action?.outputSchema;

  if (isJsonSchemaLike(outputSchema)) {
    return outputSchema;
  }

  return createOpenObjectSchema();
};
const getMemoryContextSchema = (
  memoryDefinitions: MemoryDefinition[] = [],
): JsonSchemaLike => {
  const memoryProperties = memoryDefinitions.reduce<
    Record<string, JsonSchemaLike>
  >((acc, memoryDefinition) => {
    const memorySchema = memoryDefinition?.schema;

    if (!memoryDefinition?.slug) {
      return acc;
    }
    acc[memoryDefinition.slug] = isJsonSchemaLike(memorySchema)
      ? memorySchema
      : createOpenObjectSchema();

    return acc;
  }, {});

  return {
    type: "object",
    properties: memoryProperties,
    additionalProperties: false,
  };
};
const getContextSchema = (
  memoryDefinitions: MemoryDefinition[] = [],
): JsonSchemaLike => ({
  type: "object",
  properties: {
    initiatorId: { type: "string" },
    workflowId: { type: "string" },
    runId: { type: "string" },
    memory: getMemoryContextSchema(memoryDefinitions),
  },
  required: ["initiatorId", "workflowId", "runId"],
  additionalProperties: true,
});

export const buildJsonataGlobalsSchema = ({
  definition,
  taskDefinitions,
  actionsByName,
  memoryDefinitions,
  inputSchema,
}: BuildJsonataGlobalsSchemaArgs): GlobalsSchema => {
  const resolvedTaskDefinitions =
    taskDefinitions ?? extractTaskDefinitions(definition?.defs ?? {});
  const outputProperties = Object.entries(resolvedTaskDefinitions).reduce<
    Record<string, JsonSchemaLike>
  >((acc, [taskName, taskDefinition]) => {
    acc[taskName] = getTaskOutputSchema({
      taskDefinition,
      actionsByName,
    });

    return acc;
  }, {});

  return {
    type: "object",
    properties: {
      $input: isJsonSchemaLike(inputSchema)
        ? inputSchema
        : createOpenObjectSchema(),
      $output: {
        type: "object",
        properties: outputProperties,
        additionalProperties: true,
      },
      $context: getContextSchema(memoryDefinitions),
    },
  };
};
