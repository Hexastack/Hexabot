/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowType } from "@hexabot-ai/types";
import {
  Avatar,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useTranslate } from "@/hooks/useTranslate";
import type { TTranslationKeys } from "@/i18n/i18n.types";

type WorkflowTypeSelectorProps = {
  name: string;
  value: WorkflowType;
  onChange: (value: WorkflowType) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

type WorkflowTypeCardContent = {
  triggerLabelKey: TTranslationKeys;
  triggerDefaultValue: string;
  schemaEditabilityLabelKey: TTranslationKeys;
  schemaEditabilityDefaultValue: string;
  isSchemaEditable: boolean;
};

const WORKFLOW_TYPE_CARD_CONTENT: Record<
  WorkflowType,
  WorkflowTypeCardContent
> = {
  [WorkflowType.conversational]: {
    triggerLabelKey: "message.workflow_type_conversational_trigger",
    triggerDefaultValue: "Triggered by chat messages and events.",
    schemaEditabilityLabelKey:
      "message.workflow_type_conversational_schema_editability",
    schemaEditabilityDefaultValue:
      "You can't edit input schema. Input is system-defined.",
    isSchemaEditable: false,
  },
  [WorkflowType.manual]: {
    triggerLabelKey: "message.workflow_type_manual_trigger",
    triggerDefaultValue: "Triggered via API or manual calls.",
    schemaEditabilityLabelKey:
      "message.workflow_type_manual_schema_editability",
    schemaEditabilityDefaultValue:
      "You can edit input schema. You define the input schema.",
    isSchemaEditable: true,
  },
  [WorkflowType.scheduled]: {
    triggerLabelKey: "message.workflow_type_scheduled_trigger",
    triggerDefaultValue: "Triggered on a schedule.",
    schemaEditabilityLabelKey:
      "message.workflow_type_scheduled_schema_editability",
    schemaEditabilityDefaultValue:
      "You can't edit input schema. Input is system-defined.",
    isSchemaEditable: false,
  },
};
const WORKFLOW_TYPE_VALUES = Object.values(WorkflowType) as WorkflowType[];
const formatWorkflowTypeLabel = (type: WorkflowType) =>
  type.charAt(0).toUpperCase() + type.slice(1);

export const WorkflowTypeSelector = ({
  name,
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  helperText,
}: WorkflowTypeSelectorProps) => {
  const { t } = useTranslate();
  const typeLabel = t("label.type", { defaultValue: "Workflow type" });

  return (
    <FormControl
      component="fieldset"
      required
      disabled={disabled}
      error={error}
      fullWidth
    >
      <FormLabel component="legend" sx={{ mb: 1 }}>
        {typeLabel}
      </FormLabel>

      <RadioGroup
        name={name}
        value={value}
        onBlur={onBlur}
        aria-label={typeLabel}
        onChange={(event) => {
          if (!disabled) {
            onChange(event.target.value as WorkflowType);
          }
        }}
        sx={{ gap: 1 }}
      >
        {WORKFLOW_TYPE_VALUES.map((type) => {
          const typeInfo = WORKFLOW_TYPES[type];
          const details = WORKFLOW_TYPE_CARD_CONTENT[type];
          const isSelected = value === type;
          const label = typeInfo
            ? t(typeInfo.labelKey)
            : t(`label.${type}`, {
                defaultValue: formatWorkflowTypeLabel(type),
              });
          const Icon = typeInfo?.icon;
          const iconColor = typeInfo?.color;

          return (
            <Paper
              key={type}
              variant="outlined"
              sx={(theme) => ({
                borderColor: isSelected ? "primary.main" : "divider",
                backgroundColor: isSelected
                  ? alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === "dark" ? 0.24 : 0.08,
                    )
                  : "background.paper",
                transition: theme.transitions.create(
                  ["border-color", "background-color"],
                  {
                    duration: theme.transitions.duration.shorter,
                  },
                ),
                ...(disabled && !isSelected ? { opacity: 0.72 } : null),
                "&:hover": disabled
                  ? undefined
                  : {
                      borderColor: isSelected
                        ? "primary.main"
                        : "text.secondary",
                    },
              })}
            >
              <FormControlLabel
                value={type}
                disabled={disabled}
                control={<Radio size="small" sx={{ mt: 0.25 }} />}
                sx={{
                  m: 0,
                  px: 1.25,
                  py: 1,
                  width: "100%",
                  alignItems: "flex-start",
                  ".MuiFormControlLabel-label": {
                    flex: 1,
                  },
                }}
                label={
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar
                        variant="rounded"
                        sx={(theme) => ({
                          width: 28,
                          height: 28,
                          color: iconColor ?? "text.secondary",
                          backgroundColor: alpha(
                            iconColor ?? theme.palette.text.secondary,
                            theme.palette.mode === "dark" ? 0.24 : 0.12,
                          ),
                        })}
                      >
                        {Icon ? <Icon size={16} /> : null}
                      </Avatar>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={isSelected ? "primary.main" : "text.primary"}
                      >
                        {label}
                      </Typography>
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      {t(details.triggerLabelKey, {
                        defaultValue: details.triggerDefaultValue,
                      })}
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight={500}
                      color={
                        details.isSchemaEditable
                          ? "success.main"
                          : "text.secondary"
                      }
                    >
                      {t(details.schemaEditabilityLabelKey, {
                        defaultValue: details.schemaEditabilityDefaultValue,
                      })}
                    </Typography>
                  </Stack>
                }
              />
            </Paper>
          );
        })}
      </RadioGroup>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};
