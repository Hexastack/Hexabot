/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Divider, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { WorkflowType, type IWorkflow } from "@/types/workfow.types";

import { useWorkflow } from "../../../hooks/useWorkflow";

import { BASE_TYPES, TYPE_ORDER } from "./constants";
import { FlowsDrawerCollapsedActions } from "./FlowsDrawerCollapsedActions";
import { FlowsDrawerHeader } from "./FlowsDrawerHeader";
import { FlowsDrawerList } from "./FlowsDrawerList";
import { FlowsDrawerMenu } from "./FlowsDrawerMenu";
import { FlowsDrawerSearchActions } from "./FlowsDrawerSearchActions";
import { StyledDrawer } from "./styles";
import type { FlowMatch, FlowTypeGroup, FlowsDrawerProps } from "./types";
import {
  fuzzyMatchIndices,
  getErrorCount,
  isDraftWorkflow,
  normalizeQuery,
} from "./utils";

export const FlowsDrawer = ({ onNew, onEdit }: FlowsDrawerProps) => {
  const { t } = useTranslate();
  const { workflows, selectedFlowId, updateWorkflowURL, workflow, yaml } =
    useWorkflow();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("lg"));
  const [open, setOpen] = useState(!isCompact);
  const [query, setQuery] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuFlowId, setMenuFlowId] = useState<string | null>(null);
  const [openTypeKeys, setOpenTypeKeys] = useState<string[]>([]);

  useEffect(() => {
    setOpen(!isCompact);
  }, [isCompact]);

  const searchPlaceholder = t("visual_editor.flows_drawer.search_placeholder");
  const searchLabel = t("visual_editor.flows_drawer.search_workflows");
  const newWorkflowLabel = t("visual_editor.flows_drawer.new_workflow");
  const renameLabel = t("button.rename");
  const moreLabel = t("button.more");
  const emptySectionLabel = t("visual_editor.flows_drawer.empty.section");
  const titleLabel = t("visual_editor.flows_drawer.title");
  const normalizedQuery = normalizeQuery(query);
  const isSearching = normalizedQuery.length > 0;
  const hasUnsaved = Boolean(
    workflow?.id &&
      workflow.id === selectedFlowId &&
      (workflow.definitionYaml ?? "") !== yaml,
  );
  const matches = useMemo<FlowMatch[]>(() => {
    const list = workflows ?? [];
    const getTypeMeta = (flow: IWorkflow, typeKey: string) => {
      if (typeKey === WorkflowType.conversational) {
        return {
          secondaryText: flow.description?.trim() ?? "",
          badge: t("visual_editor.flows_drawer.badge.entry_point"),
        };
      }

      if (typeKey === WorkflowType.scheduled) {
        const schedule = flow.schedule?.trim();

        return {
          secondaryText: schedule
            ? t("visual_editor.flows_drawer.meta.cron", { 0: schedule })
            : t("visual_editor.flows_drawer.meta.no_schedule"),
        };
      }

      if (typeKey === WorkflowType.manual) {
        const paramCount = flow.memoryDefinitions?.length ?? 0;

        return {
          secondaryText: paramCount
            ? t("visual_editor.flows_drawer.meta.requires_params", {
                0: paramCount,
              })
            : t("visual_editor.flows_drawer.meta.no_params"),
          badge: paramCount
            ? t("visual_editor.flows_drawer.badge.input_schema")
            : undefined,
        };
      }

      return {
        secondaryText:
          flow.description?.trim() ||
          t("visual_editor.flows_drawer.meta.no_details"),
      };
    };

    return list.flatMap((flow) => {
      const nameMatch = normalizedQuery
        ? fuzzyMatchIndices(normalizedQuery, flow.name)
        : [];
      const descriptionMatch =
        normalizedQuery && flow.description
          ? fuzzyMatchIndices(normalizedQuery, flow.description)
          : [];

      if (normalizedQuery && !nameMatch.length && !descriptionMatch.length) {
        return [];
      }

      const typeInfo = BASE_TYPES[flow.type];
      const isDraft = isDraftWorkflow(flow);
      const errorCount = getErrorCount(flow);

      return [
        {
          workflow: flow,
          nameMatch,
          descriptionMatch,
          typeInfo,
          typeMeta: getTypeMeta(flow, typeInfo.key),
          statusLabel: isDraft
            ? t("visual_editor.flows_drawer.status.draft")
            : t("visual_editor.flows_drawer.status.published"),
          isDraft,
          isSelected: flow.id === selectedFlowId,
          hasUnsaved: flow.id === selectedFlowId && hasUnsaved,
          errorCount,
          errorLabel:
            errorCount > 0
              ? t("visual_editor.flows_drawer.errors", { 0: errorCount })
              : undefined,
        },
      ];
    });
  }, [hasUnsaved, normalizedQuery, selectedFlowId, t, workflows]);
  const selectedFlowTypeKey = useMemo(() => {
    if (!workflows || !selectedFlowId) return null;

    const selectedFlow = workflows.find((flow) => flow.id === selectedFlowId);

    return selectedFlow ? BASE_TYPES[selectedFlow.type].key : null;
  }, [selectedFlowId, workflows]);
  const typeGroups = useMemo<FlowTypeGroup[]>(() => {
    const grouped = new Map<string, FlowTypeGroup>();

    Object.values(BASE_TYPES).forEach((info) => {
      grouped.set(info.key, { info, label: t(info.labelKey), items: [] });
    });

    matches.forEach((match) => {
      const key = match.typeInfo.key;

      if (!grouped.has(key)) {
        grouped.set(key, {
          info: match.typeInfo,
          label: t(match.typeInfo.labelKey),
          items: [],
        });
      }
      grouped.get(key)?.items.push(match);
    });

    const sorted = Array.from(grouped.values()).sort((a, b) => {
      const orderA = TYPE_ORDER[a.info.key as WorkflowType] ?? 99;
      const orderB = TYPE_ORDER[b.info.key as WorkflowType] ?? 99;

      if (orderA !== orderB) return orderA - orderB;

      return a.label.localeCompare(b.label);
    });

    sorted.forEach((group) => {
      group.items.sort((a, b) =>
        a.workflow.name.localeCompare(b.workflow.name),
      );
    });

    return sorted;
  }, [matches, t]);

  useEffect(() => {
    if (!typeGroups.length) {
      setOpenTypeKeys([]);

      return;
    }

    setOpenTypeKeys((prev) => {
      const groupsByKey = new Map(
        typeGroups.map((group) => [group.info.key, group]),
      );
      const next = prev.filter((key) => groupsByKey.has(key));
      const openSet = new Set(next);
      const firstGroupWithItems = typeGroups.find(
        (group) => group.items.length > 0,
      )?.info.key;
      const fallbackKey = firstGroupWithItems ?? typeGroups[0]?.info.key;

      if (isSearching) {
        const hasOpenWithItems = next.some(
          (key) => (groupsByKey.get(key)?.items.length ?? 0) > 0,
        );

        if (!hasOpenWithItems && fallbackKey) {
          openSet.add(fallbackKey);
        }
      } else if (selectedFlowTypeKey) {
        if (groupsByKey.has(selectedFlowTypeKey)) {
          openSet.add(selectedFlowTypeKey);
        }
      } else if (!openSet.size && fallbackKey) {
        openSet.add(fallbackKey);
      }

      return Array.from(openSet);
    });
  }, [isSearching, selectedFlowTypeKey, typeGroups]);

  const handleToggleDrawer = () => setOpen((prev) => !prev);
  const handleToggleType = (key: string) =>
    setOpenTypeKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  const handleSelectFlow = (flowId: string) => {
    if (flowId !== selectedFlowId) {
      updateWorkflowURL(flowId);
    }
  };
  const handleOpenMenu = (event: MouseEvent<HTMLElement>, flowId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuFlowId(flowId);
  };
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuFlowId(null);
  };
  const selectedMenuFlow = menuFlowId
    ? matches.find((match) => match.workflow.id === menuFlowId)?.workflow
    : undefined;
  const handleRename = () => {
    if (selectedMenuFlow) {
      onEdit?.(selectedMenuFlow);
    }
    handleCloseMenu();
  };
  const emptyState =
    !matches.length && workflows && workflows.length
      ? t("visual_editor.flows_drawer.empty.search")
      : t("visual_editor.flows_drawer.empty.list");

  return (
    <StyledDrawer variant="permanent" open={open}>
      <FlowsDrawerHeader
        open={open}
        title={titleLabel}
        onToggle={handleToggleDrawer}
      />
      {open ? (
        <>
          <FlowsDrawerSearchActions
            query={query}
            searchPlaceholder={searchPlaceholder}
            searchLabel={searchLabel}
            newWorkflowLabel={newWorkflowLabel}
            onQueryChange={setQuery}
            onNew={onNew}
          />
          <Divider />
          <FlowsDrawerList
            typeGroups={typeGroups}
            openTypeKeys={openTypeKeys}
            onToggleType={handleToggleType}
            onSelectFlow={handleSelectFlow}
            onEdit={onEdit}
            onOpenMenu={handleOpenMenu}
            normalizedQuery={normalizedQuery}
            emptySectionLabel={emptySectionLabel}
            emptyState={emptyState}
            hasMatches={matches.length > 0}
            renameLabel={renameLabel}
            moreLabel={moreLabel}
          />
        </>
      ) : (
        <FlowsDrawerCollapsedActions
          searchLabel={searchLabel}
          newWorkflowLabel={newWorkflowLabel}
          onOpen={() => setOpen(true)}
          onNew={onNew}
        />
      )}
      <FlowsDrawerMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        onRename={handleRename}
        renameLabel={renameLabel}
      />
    </StyledDrawer>
  );
};
