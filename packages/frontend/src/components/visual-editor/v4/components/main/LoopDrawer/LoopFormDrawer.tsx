/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  StepType,
  Workflow as WorkflowHelper,
  type FlowStep,
  type JsonValue,
} from "@hexabot-ai/agentic";
import { ENodeType, type FlowStepPath, type GraphNode } from "@hexabot-ai/graph";
import {
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { JsonataFormulaField } from "@/app-components/inputs/JsonataFormulaField";
import { useTranslate } from "@/hooks/useTranslate";

import { useWorkflow } from "../../../hooks/useWorkflow";
import {
  useStepDrawerClose,
  withStepDrawerLayout,
} from "../StepDrawer/withStepDrawerLayout";

const DEFAULT_FOR_EACH_ITEM = "item";
const DEFAULT_FOR_EACH_IN = "=[]";
const DEFAULT_ACCUMULATE_AS = "items";
const DEFAULT_ACCUMULATE_INITIAL = "[]";
const DEFAULT_ACCUMULATE_MERGE = "=$append($accumulator, [$iteration.item])";

type LoopStep = Extract<FlowStep, { loop: unknown }>;
type LoopFormValues = {
  name: string;
  description: string;
  forEachItem: string;
  forEachIn: string;
  maxConcurrency: string;
  until: string;
  accumulateEnabled: boolean;
  accumulateAs: string;
  accumulateInitial: string;
  accumulateMerge: string;
};
type LoopFormErrors = {
  forEachItem?: string;
  forEachIn?: string;
  maxConcurrency?: string;
  until?: string;
  accumulateAs?: string;
  accumulateInitial?: string;
  accumulateMerge?: string;
};

const isLoopStep = (step: unknown): step is LoopStep => {
  if (!step || typeof step !== "object" || !("loop" in step)) {
    return false;
  }

  const loop = (step as { loop?: { steps?: unknown } }).loop;

  return Boolean(loop && Array.isArray(loop.steps));
};
const getStepPath = (node: GraphNode | undefined): FlowStepPath | undefined => {
  if (!node) {
    return undefined;
  }

  const stepPath = (node.data as { stepPath?: FlowStepPath }).stepPath;

  return Array.isArray(stepPath) ? stepPath : undefined;
};
const parseJsonValue = (value: string): JsonValue | undefined => {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return undefined;
  }
};
const getLoopFormValues = (step?: LoopStep): LoopFormValues => {
  const loop = step?.loop;
  const accumulate = loop?.accumulate;

  return {
    name: loop?.name ?? "",
    description: loop?.description ?? "",
    forEachItem: loop?.for_each?.item ?? DEFAULT_FOR_EACH_ITEM,
    forEachIn: loop?.for_each?.in ?? DEFAULT_FOR_EACH_IN,
    maxConcurrency:
      typeof loop?.max_concurrency === "number"
        ? String(loop.max_concurrency)
        : "",
    until: loop?.until ?? "",
    accumulateEnabled: Boolean(accumulate),
    accumulateAs: accumulate?.as ?? DEFAULT_ACCUMULATE_AS,
    accumulateInitial: accumulate
      ? JSON.stringify(accumulate.initial, null, 2)
      : DEFAULT_ACCUMULATE_INITIAL,
    accumulateMerge: accumulate?.merge ?? DEFAULT_ACCUMULATE_MERGE,
  };
};

type LoopFormDrawerContentProps = {
  isOpen: boolean;
  values: LoopFormValues;
  errors: LoopFormErrors;
  onFieldChange: (field: keyof LoopFormValues, value: string | boolean) => void;
};

const LoopFormDrawerContent = ({
  isOpen,
  values,
  errors,
  onFieldChange,
}: LoopFormDrawerContentProps) => {
  const { t } = useTranslate();

  if (!isOpen) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {/* <TextField
        fullWidth
        size="small"
        label={t("visual_editor.loop_drawer.form.name.label")}
        value={values.name}
        onChange={(event) => onFieldChange("name", event.target.value)}
        helperText={t("visual_editor.loop_drawer.form.name.helper")}
      />
      <TextField
        fullWidth
        size="small"
        label={t("visual_editor.loop_drawer.form.description.label")}
        value={values.description}
        onChange={(event) => onFieldChange("description", event.target.value)}
        helperText={t("visual_editor.loop_drawer.form.description.helper")}
        multiline
        minRows={2}
      /> */}

      <Box>
        <Typography variant="subtitle2" mb={1}>
          {t("visual_editor.loop_drawer.form.for_each.section")}
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            label={t("visual_editor.loop_drawer.form.for_each.item_label")}
            value={values.forEachItem}
            onChange={(event) =>
              onFieldChange("forEachItem", event.target.value)
            }
            helperText={
              errors.forEachItem ??
              t("visual_editor.loop_drawer.form.for_each.item_helper")
            }
            error={Boolean(errors.forEachItem)}
          />
          <Box>
            <Typography variant="subtitle2" mb={0.5}>
              {t("visual_editor.loop_drawer.form.for_each.in_label")}
            </Typography>
            <JsonataFormulaField
              value={values.forEachIn}
              onChange={(nextValue) => onFieldChange("forEachIn", nextValue)}
              helperText={
                errors.forEachIn ??
                t("visual_editor.loop_drawer.form.for_each.in_helper")
              }
              fullWidth
            />
          </Box>
        </Stack>
      </Box>

      <TextField
        fullWidth
        size="small"
        type="number"
        label={t("visual_editor.loop_drawer.form.max_concurrency.label")}
        value={values.maxConcurrency}
        onChange={(event) =>
          onFieldChange("maxConcurrency", event.target.value)
        }
        helperText={
          errors.maxConcurrency ??
          t("visual_editor.loop_drawer.form.max_concurrency.helper")
        }
        error={Boolean(errors.maxConcurrency)}
        slotProps={{
          htmlInput: {
            min: 1,
            step: 1,
          },
        }}
      />

      <Box>
        <Typography variant="subtitle2" mb={0.5}>
          {t("visual_editor.loop_drawer.form.until.label")}
        </Typography>
        <JsonataFormulaField
          value={values.until}
          onChange={(nextValue) => onFieldChange("until", nextValue)}
          helperText={
            errors.until ?? t("visual_editor.loop_drawer.form.until.helper")
          }
          fullWidth
        />
      </Box>

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={values.accumulateEnabled}
              onChange={(_, checked) =>
                onFieldChange("accumulateEnabled", checked)
              }
            />
          }
          label={t("visual_editor.loop_drawer.form.accumulate.enabled")}
        />
        {values.accumulateEnabled ? (
          <Stack spacing={1.5} mt={1}>
            <TextField
              fullWidth
              size="small"
              label={t("visual_editor.loop_drawer.form.accumulate.as_label")}
              value={values.accumulateAs}
              onChange={(event) =>
                onFieldChange("accumulateAs", event.target.value)
              }
              helperText={
                errors.accumulateAs ??
                t("visual_editor.loop_drawer.form.accumulate.as_helper")
              }
              error={Boolean(errors.accumulateAs)}
            />
            <TextField
              fullWidth
              size="small"
              label={t(
                "visual_editor.loop_drawer.form.accumulate.initial_label",
              )}
              value={values.accumulateInitial}
              onChange={(event) =>
                onFieldChange("accumulateInitial", event.target.value)
              }
              helperText={
                errors.accumulateInitial ??
                t("visual_editor.loop_drawer.form.accumulate.initial_helper")
              }
              error={Boolean(errors.accumulateInitial)}
              multiline
              minRows={3}
            />
            <Box>
              <Typography variant="subtitle2" mb={0.5}>
                {t("visual_editor.loop_drawer.form.accumulate.merge_label")}
              </Typography>
              <JsonataFormulaField
                value={values.accumulateMerge}
                onChange={(nextValue) =>
                  onFieldChange("accumulateMerge", nextValue)
                }
                helperText={
                  errors.accumulateMerge ??
                  t("visual_editor.loop_drawer.form.accumulate.merge_helper")
                }
                fullWidth
              />
            </Box>
          </Stack>
        ) : null}
      </Box>
    </Stack>
  );
};
const LoopFormDrawerLayout = withStepDrawerLayout(LoopFormDrawerContent);

export const LoopFormDrawer = () => {
  const { t } = useTranslate();
  const {
    selectedNodeIds,
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
  const isLoopOperatorNode =
    selectedNode?.type === ENodeType.OPERATOR &&
    (selectedNode.data as { operatorType?: string }).operatorType ===
      StepType.Loop;
  const stepPath = isLoopOperatorNode ? getStepPath(selectedNode) : undefined;
  const selectedStep = useMemo(() => {
    if (!definition || !stepPath) {
      return undefined;
    }

    const stepAtPath = WorkflowHelper.getValueAtPath(definition, stepPath);

    return isLoopStep(stepAtPath) ? stepAtPath : undefined;
  }, [definition, stepPath]);
  const [formValues, setFormValues] = useState<LoopFormValues>(
    getLoopFormValues(),
  );
  const open = Boolean(isLoopOperatorNode && selectedNodeId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormValues(getLoopFormValues(selectedStep));
  }, [open, selectedStep, selectedNodeId]);

  const normalizedValues = useMemo(
    () => ({
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      forEachItem: formValues.forEachItem.trim(),
      forEachIn: formValues.forEachIn.trim(),
      maxConcurrency: formValues.maxConcurrency.trim(),
      until: formValues.until.trim(),
      accumulateAs: formValues.accumulateAs.trim(),
      accumulateInitial: formValues.accumulateInitial.trim(),
      accumulateMerge: formValues.accumulateMerge.trim(),
    }),
    [formValues],
  );
  const parsedMaxConcurrency = useMemo(() => {
    if (!normalizedValues.maxConcurrency) {
      return undefined;
    }

    return Number(normalizedValues.maxConcurrency);
  }, [normalizedValues.maxConcurrency]);
  const parsedAccumulateInitial = useMemo(() => {
    if (!formValues.accumulateEnabled) {
      return undefined;
    }

    return parseJsonValue(normalizedValues.accumulateInitial);
  }, [formValues.accumulateEnabled, normalizedValues.accumulateInitial]);
  const errors = useMemo<LoopFormErrors>(() => {
    const requiredErrorLabel = t("visual_editor.loop_drawer.form.errors.required");
    const jsonataRequiredErrorLabel = t(
      "visual_editor.loop_drawer.form.errors.jsonata_required",
    );
    const jsonInvalidErrorLabel = t(
      "visual_editor.loop_drawer.form.errors.json_invalid",
    );
    const maxConcurrencyErrorLabel = t(
      "visual_editor.loop_drawer.form.errors.positive_integer",
    );
    const hasInvalidMaxConcurrency =
      normalizedValues.maxConcurrency !== "" &&
      (parsedMaxConcurrency === undefined ||
        !Number.isInteger(parsedMaxConcurrency) ||
        parsedMaxConcurrency <= 0);
    const hasInvalidUntil =
      Boolean(normalizedValues.until) &&
      !normalizedValues.until.startsWith("=");
    const hasInvalidAccumulateMerge =
      formValues.accumulateEnabled &&
      (!normalizedValues.accumulateMerge ||
        !normalizedValues.accumulateMerge.startsWith("="));
    const hasInvalidAccumulateAs =
      formValues.accumulateEnabled && !normalizedValues.accumulateAs;
    const hasInvalidAccumulateInitial =
      formValues.accumulateEnabled && parsedAccumulateInitial === undefined;

    return {
      forEachItem: normalizedValues.forEachItem ? undefined : requiredErrorLabel,
      forEachIn: !normalizedValues.forEachIn
        ? requiredErrorLabel
        : !normalizedValues.forEachIn.startsWith("=")
          ? jsonataRequiredErrorLabel
          : undefined,
      maxConcurrency: hasInvalidMaxConcurrency
        ? maxConcurrencyErrorLabel
        : undefined,
      until: hasInvalidUntil ? jsonataRequiredErrorLabel : undefined,
      accumulateAs: hasInvalidAccumulateAs ? requiredErrorLabel : undefined,
      accumulateInitial: hasInvalidAccumulateInitial
        ? !normalizedValues.accumulateInitial
          ? requiredErrorLabel
          : jsonInvalidErrorLabel
        : undefined,
      accumulateMerge: hasInvalidAccumulateMerge
        ? !normalizedValues.accumulateMerge
          ? requiredErrorLabel
          : jsonataRequiredErrorLabel
        : undefined,
    };
  }, [
    formValues.accumulateEnabled,
    normalizedValues,
    parsedAccumulateInitial,
    parsedMaxConcurrency,
    t,
  ]);
  const hasInvalidForm = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors],
  );
  const handleFieldChange = (
    field: keyof LoopFormValues,
    value: string | boolean,
  ) => {
    setFormValues((prev) => {
      if (field === "accumulateEnabled") {
        const enabled = Boolean(value);

        if (!enabled) {
          return { ...prev, accumulateEnabled: false };
        }

        return {
          ...prev,
          accumulateEnabled: true,
          accumulateAs: prev.accumulateAs.trim()
            ? prev.accumulateAs
            : DEFAULT_ACCUMULATE_AS,
          accumulateInitial: prev.accumulateInitial.trim()
            ? prev.accumulateInitial
            : DEFAULT_ACCUMULATE_INITIAL,
          accumulateMerge: prev.accumulateMerge.trim()
            ? prev.accumulateMerge
            : DEFAULT_ACCUMULATE_MERGE,
        };
      }

      return {
        ...prev,
        [field]: String(value),
      };
    });
  };
  const handleClose = useStepDrawerClose();
  const handleSave = () => {
    if (
      !definition ||
      !stepPath ||
      !selectedStep ||
      hasInvalidForm ||
      (formValues.accumulateEnabled && parsedAccumulateInitial === undefined)
    ) {
      return;
    }
    const nextAccumulate =
      formValues.accumulateEnabled && parsedAccumulateInitial !== undefined
        ? {
            as: normalizedValues.accumulateAs,
            initial: parsedAccumulateInitial,
            merge: normalizedValues.accumulateMerge,
          }
        : undefined;
    const nextStep: LoopStep = {
      ...selectedStep,
      loop: {
        ...(normalizedValues.name ? { name: normalizedValues.name } : {}),
        ...(normalizedValues.description
          ? { description: normalizedValues.description }
          : {}),
        for_each: {
          item: normalizedValues.forEachItem,
          in: normalizedValues.forEachIn,
        },
        ...(parsedMaxConcurrency !== undefined
          ? { max_concurrency: parsedMaxConcurrency }
          : {}),
        ...(normalizedValues.until ? { until: normalizedValues.until } : {}),
        ...(nextAccumulate ? { accumulate: nextAccumulate } : {}),
        steps: selectedStep.loop.steps ?? [],
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
  const saveDisabled =
    !definition || !stepPath || !selectedStep || hasInvalidForm || isSaving;

  return (
    <LoopFormDrawerLayout
      isOpen={open}
      values={formValues}
      errors={errors}
      onFieldChange={handleFieldChange}
      open={open}
      headerContent={
        <Box minWidth={0}>
          <Typography variant="subtitle1" noWrap>
            {t("visual_editor.loop_drawer.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("visual_editor.loop_drawer.description")}
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
            aria-label={t("button.save")}
            startIcon={<Save size={18} />}
            sx={{ minWidth: 200 }}
          >
            {t("button.save")}
          </Button>
        </Box>
      }
    />
  );
};
