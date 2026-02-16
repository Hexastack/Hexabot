/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";

import type {
  GlobalsSchema,
  JsonSchemaLike,
} from "@/app-components/inputs/JsonataFormulaField";
import type { IAction } from "@/types/action.types";
import type { IMemoryDefinition } from "@/types/memory-definition.types";

type WorkflowTaskDefinition = NonNullable<WorkflowDefinition["tasks"]>[string];
type BuildJsonataGlobalsSchemaArgs = {
  definition?: WorkflowDefinition;
  actionsByName: ReadonlyMap<string, IAction>;
  memoryDefinitions?: IMemoryDefinition[];
};

const createOpenObjectSchema = (): JsonSchemaLike => ({
  type: "object",
  properties: {},
  additionalProperties: true,
});
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
  memoryDefinitions: IMemoryDefinition[] = [],
): JsonSchemaLike => {
  const memoryProperties = memoryDefinitions.reduce<Record<string, JsonSchemaLike>>(
    (acc, memoryDefinition) => {
      const memorySchema = memoryDefinition?.schema;

      if (!memoryDefinition?.slug) {
        return acc;
      }
      acc[memoryDefinition.slug] = isJsonSchemaLike(memorySchema)
        ? memorySchema
        : createOpenObjectSchema();

      return acc;
    },
    {},
  );

  return {
    type: "object",
    properties: memoryProperties,
    additionalProperties: false,
  };
};
const getContextSchema = (
  memoryDefinitions: IMemoryDefinition[] = [],
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
  actionsByName,
  memoryDefinitions,
}: BuildJsonataGlobalsSchemaArgs): GlobalsSchema => {
  const outputProperties = Object.entries(definition?.tasks ?? {}).reduce<
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
      $input: createOpenObjectSchema(),
      $output: {
        type: "object",
        properties: outputProperties,
        additionalProperties: true,
      },
      $context: getContextSchema(memoryDefinitions),
    },
  };
};
