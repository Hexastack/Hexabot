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

import {
  ENodeType,
  type WorkflowAction,
  type WorkflowBindingDefinition,
} from "../types/workflow-node.types";

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
const createActionCatalog = (
  bindingsByAction: Record<string, readonly string[]>,
): ReadonlyMap<string, WorkflowAction> => {
  return new Map(
    Object.entries(bindingsByAction).map(([actionName, supportedBindings]) => [
      actionName,
      {
        name: actionName,
        supportedBindings,
      },
    ]),
  );
};
const createBindingCatalog = (
  bindingKinds: Array<
    string | { kind: string; multiple?: boolean; color?: string; icon?: string }
  >,
): ReadonlyMap<string, WorkflowBindingDefinition> => {
  return new Map<string, WorkflowBindingDefinition>(
    bindingKinds.map((bindingKind): [string, WorkflowBindingDefinition] => {
      if (typeof bindingKind === "string") {
        return [
          bindingKind,
          {
            schema: {},
            multiple: true,
          },
        ];
      }

      return [
        bindingKind.kind,
        {
          schema: {},
          multiple: bindingKind.multiple ?? true,
          color: bindingKind.color,
          icon: bindingKind.icon,
        },
      ];
    }),
  );
};
const buildGraph = async ({
  flow,
  tasks,
  actionCatalog = new Map(),
  bindingCatalog = new Map(),
}: {
  flow: CompiledStep[];
  tasks: TaskDefinitions;
  actionCatalog?: ReadonlyMap<string, WorkflowAction>;
  bindingCatalog?: ReadonlyMap<string, WorkflowBindingDefinition>;
}) => {
  const graph = await buildNodesAndEdges({
    config: getWorkflowDefaultConfig("horizontal"),
    flow,
    tasks,
    actionCatalog,
    bindingCatalog,
  });

  if (!graph) {
    throw new Error("Expected graph to be defined");
  }

  return graph;
};
const getNodePorts = (
  node:
    | {
        data: {
          ports?: Array<string | { id: string }>;
        };
      }
    | undefined,
) => {
  const ports = node?.data.ports ?? [];

  return ports.map((port) => (typeof port === "string" ? port : port.id));
};

describe("buildNodesAndEdges", () => {
  it("infers agent node type from action supported model binding", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["model"],
      }),
      bindingCatalog: createBindingCatalog([{ kind: "model", multiple: false }]),
    });
    const agentNodeId = createStepNodeId("0:worker", "agent");
    const taskNodeId = createStepNodeId("0:worker", "task");

    expect(graph.nodes.some((node) => node.id === agentNodeId)).toBe(true);
    expect(graph.nodes.some((node) => node.id === taskNodeId)).toBe(false);
  });

  it("creates unique tool node IDs for multiple agent tasks using the same binding ref", async () => {
    const flow: CompiledStep[] = [
      taskStep("0:first_agent", "first_agent"),
      taskStep("1:second_agent", "second_agent"),
    ];
    const tasks: TaskDefinitions = {
      first_agent: {
        action: "agent_action_a",
        bindings: {
          tools: ["search"],
        },
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
        },
      },
      second_agent: {
        action: "agent_action_b",
        bindings: {
          tools: ["search"],
        },
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
        },
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        agent_action_a: ["model", "tools"],
        agent_action_b: ["model", "tools"],
      }),
      bindingCatalog: createBindingCatalog(["tools"]),
    });
    const toolNodes = graph.nodes.filter((node) => node.type === ENodeType.TOOL);

    expect(toolNodes).toHaveLength(2);
    expect(new Set(toolNodes.map((node) => node.id)).size).toBe(2);
  });

  it("renders mounted tool bindings from task.bindings.tools", async () => {
    const flow: CompiledStep[] = [taskStep("0:agent", "agent")];
    const tasks: TaskDefinitions = {
      agent: {
        action: "agent_action",
        bindings: {
          tools: ["search"],
        },
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
        },
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        agent_action: ["model", "tools"],
      }),
      bindingCatalog: createBindingCatalog(["tools"]),
    });
    const agentNodeId = createStepNodeId("0:agent", "agent");
    const toolNodes = graph.nodes.filter((node) => node.type === ENodeType.TOOL);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(toolNodes).toHaveLength(1);
    expect((toolNodes[0].data as { title?: string }).title).toBe("search");
    expect(placeholderNodes).toHaveLength(1);
    expect((placeholderNodes[0].data as { title?: string }).title).toBe("tools");
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === agentNodeId &&
          edge.sourceHandle === "agentBindingOut-0-1-tools",
      ),
    ).toBe(true);
  });

  it("renders mounted memory bindings through generic multi-binding pipeline", async () => {
    const flow: CompiledStep[] = [taskStep("0:agent", "agent")];
    const tasks: TaskDefinitions = {
      agent: {
        action: "agent_action",
        bindings: {
          memory: ["profile"],
        },
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
        },
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        agent_action: ["model", "memory"],
      }),
      bindingCatalog: createBindingCatalog([
        { kind: "model", multiple: false },
        { kind: "memory", multiple: true },
      ]),
    });
    const agentNodeId = createStepNodeId("0:agent", "agent");
    const memoryNodes = graph.nodes.filter((node) => node.type === ENodeType.TOOL);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );
    const agentNode = graph.nodes.find((node) => node.id === agentNodeId);

    expect(memoryNodes).toHaveLength(1);
    expect((memoryNodes[0].data as { title?: string }).title).toBe("profile");
    expect((memoryNodes[0].data as { description?: string }).description).toBe(
      "memory",
    );
    expect(placeholderNodes).toHaveLength(2);
    expect(
      placeholderNodes.some(
        (node) => (node.data as { title?: string }).title === "memory",
      ),
    ).toBe(true);
    expect(getNodePorts(agentNode).includes("agentMemory")).toBe(false);
    expect(getNodePorts(agentNode).includes("agentBindingOut-1-2-memory")).toBe(
      true,
    );
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === agentNodeId &&
          edge.sourceHandle === "agentBindingOut-1-2-memory",
      ),
    ).toBe(true);
  });

  it("applies binding color and icon metadata to mounted and placeholder nodes", async () => {
    const flow: CompiledStep[] = [taskStep("0:agent", "agent")];
    const tasks: TaskDefinitions = {
      agent: {
        action: "agent_action",
        bindings: {
          memory: ["profile"],
        },
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        agent_action: ["memory"],
      }),
      bindingCatalog: createBindingCatalog([
        {
          kind: "memory",
          multiple: true,
          color: "#0ea5e9",
          icon: "Database",
        },
      ]),
    });
    const memoryNode = graph.nodes.find((node) => node.type === ENodeType.TOOL);
    const placeholderNode = graph.nodes.find(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(memoryNode).toBeDefined();
    expect(
      (memoryNode?.data as { theme?: { borderColor?: string; icon?: string } }).theme,
    ).toMatchObject({
      borderColor: "#0ea5e9",
      icon: "Database",
    });
    expect(placeholderNode).toBeDefined();
    expect(
      (placeholderNode?.data as { theme?: { borderColor?: string } }).theme,
    ).toMatchObject({
      borderColor: "#0ea5e9",
    });
  });

  it("renders mounted single-ref model bindings from string task bindings", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        bindings: {
          model: "openai_chatgpt",
        },
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["model"],
      }),
      bindingCatalog: createBindingCatalog([{ kind: "model", multiple: false }]),
    });
    const agentNodeId = createStepNodeId("0:worker", "agent");
    const modelNodes = graph.nodes.filter((node) => node.type === ENodeType.SINGLE_BINDING);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(modelNodes).toHaveLength(1);
    expect((modelNodes[0].data as { title?: string }).title).toBe("openai_chatgpt");
    expect(placeholderNodes).toHaveLength(0);
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === agentNodeId &&
          edge.sourceHandle === "agentBindingOut-0-1-model",
      ),
    ).toBe(true);
  });

  it("renders model binding placeholder when model-capable action has no mounted model", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["model"],
      }),
      bindingCatalog: createBindingCatalog([{ kind: "model", multiple: false }]),
    });
    const agentNodeId = createStepNodeId("0:worker", "agent");
    const modelNodes = graph.nodes.filter((node) => node.type === ENodeType.SINGLE_BINDING);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(modelNodes).toHaveLength(0);
    expect(placeholderNodes).toHaveLength(1);
    expect((placeholderNodes[0].data as { title?: string }).title).toBe("model");
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === agentNodeId &&
          edge.sourceHandle === "agentBindingOut-0-1-model",
      ),
    ).toBe(true);
  });

  it("does not mount legacy settings.provider/model without task model binding", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
        },
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["model"],
      }),
      bindingCatalog: createBindingCatalog([{ kind: "model", multiple: false }]),
    });
    const modelNodes = graph.nodes.filter((node) => node.type === ENodeType.SINGLE_BINDING);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(modelNodes).toHaveLength(0);
    expect(placeholderNodes).toHaveLength(1);
  });

  it("renders single-binding nodes for custom binding kinds when multiple=false", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        bindings: {
          knowledge_base: "kb_main",
        },
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["knowledge_base"],
      }),
      bindingCatalog: createBindingCatalog([
        { kind: "knowledge_base", multiple: false },
      ]),
    });
    const taskNodeId = createStepNodeId("0:worker", "task");
    const singleBindingNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.SINGLE_BINDING,
    );
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(singleBindingNodes).toHaveLength(1);
    expect((singleBindingNodes[0].data as { title?: string }).title).toBe("kb_main");
    expect(placeholderNodes).toHaveLength(0);
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === taskNodeId &&
          edge.sourceHandle === "taskBindingOut-0-1-knowledge_base",
      ),
    ).toBe(true);
  });

  it("renders binding placeholders for non-agent tasks with supported bindings", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["tools"],
      }),
      bindingCatalog: createBindingCatalog(["tools"]),
    });
    const taskNodeId = createStepNodeId("0:worker", "task");
    const taskNode = graph.nodes.find((node) => node.id === taskNodeId);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );

    expect(taskNode).toBeDefined();
    expect(getNodePorts(taskNode).includes("taskBindingOut-0-1-tools")).toBe(true);
    expect(placeholderNodes).toHaveLength(1);
    expect(
      graph.edges.some(
        (edge) =>
          edge.source === taskNodeId &&
          edge.sourceHandle === "taskBindingOut-0-1-tools",
      ),
    ).toBe(true);
  });

  it("filters unsupported binding kinds that are missing from the binding catalog", async () => {
    const flow: CompiledStep[] = [taskStep("0:worker", "worker")];
    const tasks: TaskDefinitions = {
      worker: {
        action: "worker_action",
        bindings: {
          tools: ["search"],
        },
        settings: {},
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        worker_action: ["tools"],
      }),
      bindingCatalog: createBindingCatalog([]),
    });
    const taskNodeId = createStepNodeId("0:worker", "task");
    const taskNode = graph.nodes.find((node) => node.id === taskNodeId);
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );
    const toolNodes = graph.nodes.filter((node) => node.type === ENodeType.TOOL);

    expect(taskNode).toBeDefined();
    expect(
      getNodePorts(taskNode).some((port) => port.startsWith("taskBindingOut-")),
    ).toBe(false);
    expect(placeholderNodes).toHaveLength(0);
    expect(toolNodes).toHaveLength(0);
  });

  it("does not mount legacy settings.tools without task bindings", async () => {
    const flow: CompiledStep[] = [taskStep("0:agent", "agent")];
    const tasks: TaskDefinitions = {
      agent: {
        action: "agent_action",
        settings: {
          provider: "openai",
          model: "gpt-4o-mini",
          tools: ["search"],
        },
      },
    };
    const graph = await buildGraph({
      flow,
      tasks,
      actionCatalog: createActionCatalog({
        agent_action: ["model", "tools"],
      }),
      bindingCatalog: createBindingCatalog(["tools"]),
    });
    const placeholderNodes = graph.nodes.filter(
      (node) => node.type === ENodeType.BINDING_PLACEHOLDER,
    );
    const toolNodes = graph.nodes.filter((node) => node.type === ENodeType.TOOL);

    expect(placeholderNodes).toHaveLength(1);
    expect(toolNodes).toHaveLength(0);
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

  it("preserves conditional branch source handles on overlay edges to nested conditional groups", async () => {
    const nestedConditional: CompiledConditionalStep = {
      id: "0.branch.1:nested_conditional",
      label: "nested_conditional",
      type: StepType.Conditional,
      branches: [
        {
          id: "0.branch.1:nested_conditional:when:0",
          condition: { kind: "literal", value: "no" },
          steps: [],
        },
        {
          id: "0.branch.1:nested_conditional:when:1",
          steps: [],
        },
      ],
    };
    const outerConditional: CompiledConditionalStep = {
      id: "0:conditional",
      label: "conditional",
      type: StepType.Conditional,
      branches: [
        {
          id: "0:conditional:when:0",
          condition: { kind: "literal", value: "false" },
          steps: [],
        },
        {
          id: "0:conditional:when:1",
          steps: [nestedConditional],
        },
      ],
    };
    const graph = await buildGraph({
      flow: [outerConditional],
      tasks: {},
    });
    const outerOperatorNodeId = createStepNodeId(outerConditional.id, "operator");
    const nestedGroupId = createGroupId(nestedConditional.id);
    const firstBranchPlaceholderId = createPlaceholderNodeId(
      outerConditional.id,
      "conditional",
      0,
    );
    const firstBranchEdge = graph.edges.find(
      (edge) =>
        edge.source === outerOperatorNodeId &&
        edge.target === firstBranchPlaceholderId &&
        !edge.hidden,
    );
    const nestedBranchOverlayEdge = graph.edges.find(
      (edge) =>
        edge.source === outerOperatorNodeId &&
        edge.target === nestedGroupId &&
        !edge.hidden,
    );

    expect(firstBranchEdge).toBeDefined();
    expect(firstBranchEdge?.sourceHandle).toBe("operatorOut-0-2");
    expect(nestedBranchOverlayEdge).toBeDefined();
    expect(nestedBranchOverlayEdge?.sourceHandle).toBe("operatorOut-1-2");
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
      actionCatalog: new Map(),
      bindingCatalog: new Map(),
    });

    expect(graph).toBeUndefined();
  });
});
