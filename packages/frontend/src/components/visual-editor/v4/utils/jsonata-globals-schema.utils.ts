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

type WorkflowTaskDefinition = NonNullable<WorkflowDefinition["tasks"]>[string];
type BuildJsonataGlobalsSchemaArgs = {
  definition?: WorkflowDefinition;
  actionsByName: ReadonlyMap<string, IAction>;
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

export const buildJsonataGlobalsSchema = ({
  definition,
  actionsByName,
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
      $context: createOpenObjectSchema(),
    },
  };
};
