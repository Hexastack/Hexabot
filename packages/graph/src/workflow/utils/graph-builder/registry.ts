/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { SemanticEdge, SemanticNode } from "./types";

const mergeEdge = (
  existing: SemanticEdge,
  incoming: SemanticEdge,
): SemanticEdge => {
  return {
    ...existing,
    ...incoming,
    hidden: Boolean(existing.hidden || incoming.hidden),
    label: existing.label ?? incoming.label,
    insertPath:
      incoming.insertPath !== undefined
        ? incoming.insertPath
        : existing.insertPath,
  };
};

export class GraphRegistry {
  private nodeById = new Map<string, SemanticNode>();
  private edgeById = new Map<string, SemanticEdge>();
  private nodeOrder: string[] = [];
  private edgeOrder: string[] = [];

  upsertNode(node: SemanticNode): SemanticNode {
    const existing = this.nodeById.get(node.id);

    if (existing) {
      return existing;
    }

    this.nodeById.set(node.id, node);
    this.nodeOrder.push(node.id);

    return node;
  }

  getNode(nodeId: string): SemanticNode | undefined {
    return this.nodeById.get(nodeId);
  }

  upsertEdge(edge: SemanticEdge): SemanticEdge {
    const existing = this.edgeById.get(edge.id);

    if (existing) {
      const merged = mergeEdge(existing, edge);

      this.edgeById.set(edge.id, merged);

      return merged;
    }

    this.edgeById.set(edge.id, edge);
    this.edgeOrder.push(edge.id);

    return edge;
  }

  patchEdge(edgeId: string, patch: Partial<SemanticEdge>): void {
    const existing = this.edgeById.get(edgeId);

    if (!existing) {
      return;
    }

    this.edgeById.set(edgeId, {
      ...existing,
      ...patch,
      hidden:
        patch.hidden !== undefined
          ? Boolean(existing.hidden || patch.hidden)
          : existing.hidden,
    });
  }

  listNodes(): SemanticNode[] {
    return this.nodeOrder
      .map((nodeId) => this.nodeById.get(nodeId))
      .filter((node): node is SemanticNode => Boolean(node));
  }

  listEdges(): SemanticEdge[] {
    return this.edgeOrder
      .map((edgeId) => this.edgeById.get(edgeId))
      .filter((edge): edge is SemanticEdge => Boolean(edge));
  }
}
