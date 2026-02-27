/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  StepType,
  type CompiledConditionalStep,
  type CompiledLoopStep,
  type CompiledParallelStep,
  type CompiledStep,
  type TaskDefinitions,
} from "@hexabot-ai/agentic";
import { describe, expect, it } from "vitest";

import { ENodeType } from "../types/workflow-node.types";

import {
  END_INDICATOR_ID,
  createGroupId,
  createPlaceholderNodeId,
  createStepNodeId,
} from "./graph-builder/id-factory";
import { buildNodesAndEdges, getWorkflowDefaultConfig } from "./workflow-node.utils";

const taskStep = (id: string, taskName: string): CompiledStep => {
  return {
    id,
    label: taskName,
    type: StepType.Task,
    taskName,
  };
};
const baseTasks = (taskNames: string[]): TaskDefinitions => {
  return taskNames.reduce((acc, taskName) => {
    acc[taskName] = {
      action: `action_${taskName}`,
      settings: {},
    };

    return acc;
  }, {} as TaskDefinitions);
};
const buildGraph = async ({
  flow,
  tasks,
}: {
  flow: CompiledStep[];
  tasks: TaskDefinitions;
}) => {
  const graph = await buildNodesAndEdges({
    config: getWorkflowDefaultConfig("horizontal"),
    flow,
    tasks,
    memoryDefinitions: [],
  });

  if (!graph) {
    throw new Error("Expected graph to be defined");
  }

  return graph;
};

describe("buildNodesAndEdges", () => {
  it("creates unique tool node IDs for multiple agent tasks using the same tool", async () => {
    const flow: CompiledStep[] = [
      taskStep("0:first_agent", "first_agent"),
      taskStep("1:second_agent", "second_agent"),
    ];
    const tasks: TaskDefinitions = {
      first_agent: {
        action: "agent_action_a",
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
          tools: ["search"],
        },
      },
      second_agent: {
        action: "agent_action_b",
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
          tools: ["search"],
        },
      },
    };
    const graph = await buildGraph({ flow, tasks });
    const toolNodes = graph.nodes.filter((node) => node.type === ENodeType.TOOL);

    expect(toolNodes).toHaveLength(2);
    expect(new Set(toolNodes.map((node) => node.id)).size).toBe(2);
  });

  it("adds conditional branch handles and branch placeholders that join to downstream steps", async () => {
    const conditionalStep: CompiledConditionalStep = {
      id: "0:conditional",
      label: "conditional",
      type: StepType.Conditional,
      branches: [
        {
          id: "0:conditional:when:0",
          condition: { kind: "literal", value: "yes" },
          steps: [taskStep("0.conditional.0:branch_yes", "branch_yes")],
        },
        {
          id: "0:conditional:when:1",
          steps: [],
        },
      ],
    };
    const flow: CompiledStep[] = [
      conditionalStep,
      taskStep("1:after_conditional", "after_conditional"),
    ];
    const tasks = baseTasks(["branch_yes", "after_conditional"]);
    const graph = await buildGraph({ flow, tasks });
    const operatorNodeId = createStepNodeId(conditionalStep.id, "operator");
    const afterNodeId = createStepNodeId("1:after_conditional", "task");
    const firstPlaceholder = createPlaceholderNodeId(
      conditionalStep.id,
      "conditional",
      0,
    );
    const secondPlaceholder = createPlaceholderNodeId(
      conditionalStep.id,
      "conditional",
      1,
    );

    expect(
      graph.edges.some(
        (edge) =>
          edge.source === operatorNodeId && edge.sourceHandle === "operatorOut-0-2",
      ),
    ).toBe(true);
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === operatorNodeId && edge.sourceHandle === "operatorOut-1-2",
      ),
    ).toBe(true);

    const firstToAfter = graph.edges.find(
      (edge) => edge.source === firstPlaceholder && edge.target === afterNodeId,
    );
    const secondToAfter = graph.edges.find(
      (edge) => edge.source === secondPlaceholder && edge.target === afterNodeId,
    );

    expect(firstToAfter).toBeDefined();
    expect(secondToAfter).toBeDefined();
    expect(firstToAfter?.hidden).toBe(true);
    expect(secondToAfter?.hidden).toBe(true);
  });

  it("creates explicit parallel join edges from branch exits to a join placeholder", async () => {
    const parallelStep: CompiledParallelStep = {
      id: "0:parallel",
      label: "parallel",
      type: StepType.Parallel,
      strategy: "wait_all",
      steps: [
        taskStep("0.parallel.0:parallel_one", "parallel_one"),
        taskStep("0.parallel.1:parallel_two", "parallel_two"),
      ],
    };
    const flow: CompiledStep[] = [
      parallelStep,
      taskStep("1:after_parallel", "after_parallel"),
    ];
    const tasks = baseTasks(["parallel_one", "parallel_two", "after_parallel"]);
    const graph = await buildGraph({ flow, tasks });
    const firstBranchNodeId = createStepNodeId("0.parallel.0:parallel_one", "task");
    const secondBranchNodeId = createStepNodeId("0.parallel.1:parallel_two", "task");
    const joinPlaceholderId = createPlaceholderNodeId(parallelStep.id, "parallel", 2);
    const afterNodeId = createStepNodeId("1:after_parallel", "task");

    expect(
      graph.edges.some(
        (edge) => edge.source === firstBranchNodeId && edge.target === joinPlaceholderId,
      ),
    ).toBe(true);
    expect(
      graph.edges.some(
        (edge) => edge.source === secondBranchNodeId && edge.target === joinPlaceholderId,
      ),
    ).toBe(true);

    const joinToAfter = graph.edges.find(
      (edge) => edge.source === joinPlaceholderId && edge.target === afterNodeId,
    );

    expect(joinToAfter).toBeDefined();
    expect(joinToAfter?.hidden).toBe(true);
  });

  it("creates loop placeholder join edges for downstream continuation", async () => {
    const loopStep: CompiledLoopStep = {
      id: "0:loop",
      label: "loop",
      type: StepType.Loop,
      forEach: {
        item: "item",
        in: { kind: "literal", value: [] },
      },
      steps: [taskStep("0.loop.0:loop_task", "loop_task")],
    };
    const flow: CompiledStep[] = [
      loopStep,
      taskStep("1:after_loop", "after_loop"),
    ];
    const tasks = baseTasks(["loop_task", "after_loop"]);
    const graph = await buildGraph({ flow, tasks });
    const loopTaskId = createStepNodeId("0.loop.0:loop_task", "task");
    const loopPlaceholderId = createPlaceholderNodeId(loopStep.id, "loop", 0);
    const afterNodeId = createStepNodeId("1:after_loop", "task");

    expect(
      graph.edges.some(
        (edge) => edge.source === loopTaskId && edge.target === loopPlaceholderId,
      ),
    ).toBe(true);

    const placeholderToAfter = graph.edges.find(
      (edge) => edge.source === loopPlaceholderId && edge.target === afterNodeId,
    );

    expect(placeholderToAfter).toBeDefined();
    expect(placeholderToAfter?.hidden).toBe(true);
  });

  it("attaches end-indicator edges with next insert path metadata", async () => {
    const flow: CompiledStep[] = [taskStep("0:single", "single")];
    const graph = await buildGraph({ flow, tasks: baseTasks(["single"]) });
    const singleNodeId = createStepNodeId("0:single", "task");
    const endEdge = graph.edges.find(
      (edge) => edge.source === singleNodeId && edge.target === END_INDICATOR_ID,
    );

    expect(endEdge).toBeDefined();
    expect((endEdge?.data as { insertPath?: unknown[] } | undefined)?.insertPath).toEqual([
      "flow",
      1,
    ]);
  });

  it("creates nested group nodes and deduplicates overlay group edges", async () => {
    const nestedConditional: CompiledConditionalStep = {
      id: "0.loop.0:conditional",
      label: "nested_conditional",
      type: StepType.Conditional,
      branches: [
        {
          id: "0.loop.0:conditional:when:0",
          condition: { kind: "literal", value: "yes" },
          steps: [
            taskStep(
              "0.loop.0.conditional.0:conditional_inner_task",
              "conditional_inner_task",
            ),
          ],
        },
        {
          id: "0.loop.0:conditional:when:1",
          steps: [],
        },
      ],
    };
    const loopStep: CompiledLoopStep = {
      id: "0:loop",
      label: "loop",
      type: StepType.Loop,
      forEach: {
        item: "item",
        in: { kind: "literal", value: [] },
      },
      steps: [nestedConditional],
    };
    const flow: CompiledStep[] = [loopStep, taskStep("1:after_group", "after_group")];
    const tasks = baseTasks(["conditional_inner_task", "after_group"]);
    const graph = await buildGraph({ flow, tasks });
    const outerGroupId = createGroupId(loopStep.id);
    const innerGroupId = createGroupId(nestedConditional.id);

    expect(graph.nodes.some((node) => node.id === outerGroupId)).toBe(true);
    expect(graph.nodes.some((node) => node.id === innerGroupId)).toBe(true);

    const groupOverlayEdges = graph.edges.filter(
      (edge) => edge.source === outerGroupId && edge.target.includes("after_group"),
    );

    expect(groupOverlayEdges.length).toBe(1);
    expect(
      (groupOverlayEdges[0].data as { insertPath?: unknown[] } | undefined)
        ?.insertPath,
    ).toBeDefined();
  });

  it("does not create duplicate node or edge IDs", async () => {
    const conditionalStep: CompiledConditionalStep = {
      id: "0:conditional",
      label: "conditional",
      type: StepType.Conditional,
      branches: [
        {
          id: "0:conditional:when:0",
          condition: { kind: "literal", value: "yes" },
          steps: [taskStep("0.conditional.0:branch_yes", "branch_yes")],
        },
        {
          id: "0:conditional:when:1",
          steps: [taskStep("0.conditional.1:branch_else", "branch_else")],
        },
      ],
    };
    const parallelStep: CompiledParallelStep = {
      id: "1:parallel",
      label: "parallel",
      type: StepType.Parallel,
      strategy: "wait_any",
      steps: [
        taskStep("1.parallel.0:p1", "p1"),
        taskStep("1.parallel.1:p2", "p2"),
      ],
    };
    const flow: CompiledStep[] = [conditionalStep, parallelStep, taskStep("2:end", "end")];
    const tasks = baseTasks(["branch_yes", "branch_else", "p1", "p2", "end"]);
    const graph = await buildGraph({ flow, tasks });

    expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(graph.nodes.length);
    expect(new Set(graph.edges.map((edge) => edge.id)).size).toBe(graph.edges.length);
  });

  it("returns undefined for empty flow", async () => {
    const graph = await buildNodesAndEdges({
      config: getWorkflowDefaultConfig("horizontal"),
      flow: [],
      tasks: {},
      memoryDefinitions: [],
    });

    expect(graph).toBeUndefined();
  });
});
