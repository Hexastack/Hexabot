/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType, Workflow as WorkflowHelper, type FlowStep } from "@hexabot-ai/agentic";
import { ENodeType, type FlowStepPath, type GraphNode } from "@hexabot-ai/graph";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { withDrawerLayout } from "@/app-components/drawers/DrawerLayout";
import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflow } from "../../../hooks/useWorkflow";

type ParallelStep = Extract<FlowStep, { parallel: unknown }>;
type ParallelStrategy = "wait_all" | "wait_any";
type ParallelOption = {
  description: string;
  label: string;
  value: ParallelStrategy;
};

const DEFAULT_PARALLEL_STRATEGY: ParallelStrategy = "wait_all";
const isParallelStep = (step: unknown): step is ParallelStep => {
  if (!step || typeof step !== "object" || !("parallel" in step)) {
    return false;
  }

  const parallel = (step as { parallel?: { steps?: unknown } }).parallel;

  return Boolean(parallel && Array.isArray(parallel.steps));
};
const isParallelStrategy = (value: string): value is ParallelStrategy =>
  value === "wait_all" || value === "wait_any";
const getStepPath = (node: GraphNode | undefined): FlowStepPath | undefined => {
  if (!node) {
    return undefined;
  }

  const stepPath = (node.data as { stepPath?: FlowStepPath }).stepPath;

  return Array.isArray(stepPath) ? stepPath : undefined;
};
const getParallelStrategyValue = (step?: ParallelStep): ParallelStrategy => {
  const strategy = step?.parallel.strategy;

  return strategy === "wait_any" ? "wait_any" : DEFAULT_PARALLEL_STRATEGY;
};

type ParallelFormDrawerContentProps = {
  isOpen: boolean;
  strategy: ParallelStrategy;
  options: ParallelOption[];
  strategyLabel: string;
  onStrategyChange: (value: ParallelStrategy) => void;
  emptyStateLabel: string;
};

const ParallelFormDrawerContent = ({
  isOpen,
  strategy,
  options,
  strategyLabel,
  onStrategyChange,
  emptyStateLabel,
}: ParallelFormDrawerContentProps) => {
  if (!isOpen) {
    return null;
  }

  if (!options.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyStateLabel}
      </Typography>
    );
  }

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend">{strategyLabel}</FormLabel>
      <RadioGroup
        value={strategy}
        onChange={(event) => {
          const nextStrategy = event.target.value;

          if (isParallelStrategy(nextStrategy)) {
            onStrategyChange(nextStrategy);
          }
        }}
      >
        <Stack spacing={1} mt={1}>
          {options.map((option) => (
            <Box
              key={option.value}
              border={(theme) => `1px solid ${theme.palette.divider}`}
              borderRadius={1}
              px={1}
              py={0.5}
            >
              <FormControlLabel
                value={option.value}
                control={<Radio size="small" />}
                label={option.label}
              />
              <Typography variant="body2" color="text.secondary" ml={4}>
                {option.description}
              </Typography>
            </Box>
          ))}
        </Stack>
      </RadioGroup>
    </FormControl>
  );
};
const ParallelFormDrawerLayout = withDrawerLayout(ParallelFormDrawerContent);

export const ParallelFormDrawer = () => {
  const { t } = useTranslate();
  const {
    selectedNodeIds,
    selectedFlowId,
    updateWorkflowURL,
    definition,
    updateDefinitionState,
    isSaving,
  } = useWorkflow();
  const { getNode } = useReactFlow();
  const selectedNodeId =
    selectedNodeIds.length === 1 ? selectedNodeIds[0] : undefined;
  const selectedNode = selectedNodeId
    ? (getNode(selectedNodeId) as GraphNode | undefined)
    : undefined;
  const isParallelOperatorNode =
    selectedNode?.type === ENodeType.OPERATOR &&
    (selectedNode.data as { operatorType?: string }).operatorType ===
      StepType.Parallel;
  const stepPath = isParallelOperatorNode ? getStepPath(selectedNode) : undefined;
  const selectedStep = useMemo(() => {
    if (!definition || !stepPath) {
      return undefined;
    }

    const stepAtPath = WorkflowHelper.getValueAtPath(definition, stepPath);

    return isParallelStep(stepAtPath) ? stepAtPath : undefined;
  }, [definition, stepPath]);
  const [strategy, setStrategy] = useState<ParallelStrategy>(
    DEFAULT_PARALLEL_STRATEGY,
  );
  const open = Boolean(isParallelOperatorNode && selectedNodeId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStrategy(getParallelStrategyValue(selectedStep));
  }, [open, selectedStep, selectedNodeId]);

  const strategyOptions: ParallelOption[] = useMemo(
    () => [
      {
        value: "wait_all",
        label: t("visual_editor.parallel_drawer.form.strategy.wait_all.label"),
        description: t(
          "visual_editor.parallel_drawer.form.strategy.wait_all.description",
        ),
      },
      {
        value: "wait_any",
        label: t("visual_editor.parallel_drawer.form.strategy.wait_any.label"),
        description: t(
          "visual_editor.parallel_drawer.form.strategy.wait_any.description",
        ),
      },
    ],
    [t],
  );
  const handleClose = () => {
    if (selectedFlowId) {
      updateWorkflowURL(selectedFlowId);
    }
  };
  const handleSave = () => {
    if (!definition || !stepPath || !selectedStep) {
      return;
    }

    const nextStep: ParallelStep = {
      ...selectedStep,
      parallel: {
        ...selectedStep.parallel,
        strategy,
        steps: selectedStep.parallel.steps ?? [],
      },
    };
    const nextDefinition = WorkflowHelper.setValueAtPath(
      definition,
      stepPath,
      nextStep,
    );

    updateDefinitionState(nextDefinition);
    handleClose();
  };
  const drawerTitle = t("visual_editor.parallel_drawer.title");
  const drawerDescription = t("visual_editor.parallel_drawer.description");
  const strategyLabel = t("visual_editor.parallel_drawer.form.strategy.label");
  const saveLabel = t("button.save");
  const saveDisabled =
    !definition || !stepPath || !selectedStep || isSaving || !isParallelStrategy(strategy);

  return (
    <ParallelFormDrawerLayout
      isOpen={open}
      strategy={strategy}
      options={strategyOptions}
      strategyLabel={strategyLabel}
      onStrategyChange={setStrategy}
      emptyStateLabel={t("visual_editor.parallel_drawer.form.empty_state")}
      open={open}
      onClose={handleClose}
      headerContent={
        <Box minWidth={0}>
          <Typography variant="subtitle1" noWrap>
            {drawerTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {drawerDescription}
          </Typography>
        </Box>
      }
      footerContent={
        <Box display="flex" justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saveDisabled}
            aria-label={saveLabel}
            startIcon={<Save size={18} />}
            sx={{ minWidth: 200 }}
          >
            {saveLabel}
          </Button>
        </Box>
      }
    />
  );
};
