/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { FC, Fragment, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { WorkflowTypeBadge } from "@/app-components/workflow/WorkflowTypeBadge";
import { WORKFLOW_TYPES } from "@/constants/workflow.constants";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IMemoryDefinition } from "@/types/memory-definition.types";
import {
  IWorkflowSubmitAttributes,
  WorkflowType,
  type IWorkflow,
} from "@/types/workfow.types";

const createWorkflowBadgeStub = (type: WorkflowType): IWorkflow => ({
  id: `workflow-type-${type}`,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  format: Format.BASIC,
  name: "",
  description: null,
  schedule: null,
  type,
  memoryDefinitions: [],
  runAfterMs: 0,
  currentVersion: null,
  publishedVersion: null,
});

type WorkflowFormPreset = {
  definition?: WorkflowDefinition;
  definitionYaml?: string;
  onCreated?: (workflow: IWorkflow) => void;
  onUpdated?: (workflow: IWorkflow) => void;
};

type WorkflowFormValues = {
  name: string;
  description: string;
  type: WorkflowType;
  schedule: string;
  memoryDefinitions: string[];
};

export const WorkflowForm: FC<
  ComponentFormProps<IWorkflow, WorkflowFormPreset>
> = ({
  data: { defaultValues: workflow, presetValues },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { definition, definitionYaml, onCreated, onUpdated } =
    presetValues ?? {};
  const isEditing = Boolean(workflow?.id);
  const defaultValues = useMemo(() => {
    return workflow
      ? {
          name: workflow.name ?? "",
          description: workflow.description ?? "",
          type: workflow.type ?? WorkflowType.conversational,
          schedule: workflow.schedule ?? "",
          memoryDefinitions: workflow?.memoryDefinitions ?? [],
        }
      : {
          name: "",
          description: "",
          type: WorkflowType.conversational,
          schedule: "",
          memoryDefinitions: [],
        };
  }, [workflow]);
  const {
    control,
    register,
    reset,
    clearErrors,
    formState: { errors },
    handleSubmit,
  } = useForm<WorkflowFormValues>({
    defaultValues,
  });
  const typeValue = useWatch({ control, name: "type" });
  const nameRegister = register("name", {
    required: t("message.name_is_required"),
    setValueAs: (value: string) => value?.trim(),
  });
  const scheduleRegister = register("schedule", {
    validate: (value) => {
      if (typeValue !== WorkflowType.scheduled) {
        return true;
      }

      return (
        (value && value.trim().length > 0) ||
        t("message.schedule_is_required", {
          defaultValue: "Schedule is required for scheduled workflows.",
        })
      );
    },
  });
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createWorkflow, isPending: isCreating } = useCreate(
    EntityType.WORKFLOW,
    {
      ...options,
      onSuccess: (created) => {
        onCreated?.(created);
        options.onSuccess();
      },
    },
  );
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdate<
    EntityType.WORKFLOW,
    IWorkflowSubmitAttributes
  >(EntityType.WORKFLOW, {
    ...options,
    onSuccess: (updated) => {
      onUpdated?.(updated);
      options.onSuccess();
    },
  });
  const onSubmitForm = (params: WorkflowFormValues) => {
    const name = params.name.trim();
    const description = params.description.trim() || null;
    const schedule =
      params.type === WorkflowType.scheduled
        ? params.schedule.trim() || null
        : null;
    const memoryDefinitions = params.memoryDefinitions ?? [];

    if (workflow?.id) {
      updateWorkflow({
        id: workflow.id,
        params: {
          name,
          description,
          type: params.type,
          schedule,
          memoryDefinitions,
        },
      });

      return;
    }

    if (!definition || !definitionYaml) {
      rest.onError?.();
      toast.error(t("message.unable_to_save"));

      return;
    }

    const payload: IWorkflowSubmitAttributes = {
      name,
      description,
      type: params.type,
      schedule,
      definitionYml: definitionYaml,
      memoryDefinitions,
    };

    createWorkflow(payload);
  };

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (typeValue !== WorkflowType.scheduled) {
      clearErrors("schedule");
    }
  }, [clearErrors, typeValue]);

  return (
    <Wrapper
      onSubmit={handleSubmit(onSubmitForm)}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled: isCreating || isUpdating,
      }}
    >
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem display="flex">
            <Controller
              name="type"
              control={control}
              rules={{
                required: t("message.type_is_required", {
                  defaultValue: "Workflow type is required.",
                }),
              }}
              render={({ field }) => (
                <FormControl
                  component="fieldset"
                  required
                  disabled={isEditing}
                  error={!!errors.type}
                >
                  <RadioGroup
                    row
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    sx={{ gap: 1 }}
                    onChange={(_event, value) =>
                      field.onChange(value as WorkflowType)
                    }
                  >
                    {Object.values(WorkflowType).map((type) => {
                      const typeKey = String(type);
                      const typeInfo = WORKFLOW_TYPES[type];
                      const badgeWorkflow = workflow
                        ? { ...workflow, type }
                        : createWorkflowBadgeStub(type);
                      const typeLabel = typeInfo
                        ? t(typeInfo.labelKey)
                        : t(`label.${typeKey}`, {
                            defaultValue:
                              typeKey.charAt(0).toUpperCase() +
                              typeKey.slice(1),
                          });
                      const isSelected = typeValue === type;

                      return (
                        <FormControlLabel
                          key={typeKey}
                          value={type}
                          control={
                            <Radio
                              disableRipple
                              sx={{
                                p: 0,
                                "&.Mui-disabled": {
                                  opacity: 1,
                                },
                              }}
                              icon={
                                <WorkflowTypeBadge
                                  workflow={badgeWorkflow}
                                  selected={false}
                                />
                              }
                              checkedIcon={
                                <WorkflowTypeBadge
                                  workflow={badgeWorkflow}
                                  selected={isSelected}
                                />
                              }
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              component="span"
                              fontWeight={500}
                              color={isSelected ? "primary" : "textPrimary"}
                            >
                              {typeLabel}
                            </Typography>
                          }
                          sx={{
                            gap: 1,
                            ml: 0,
                            mr: 0,
                            "&.Mui-disabled": {
                              opacity: 0.8,
                              cursor: "not-allowed",
                            },
                            "&.Mui-disabled .MuiTypography-root": {
                              color: "text.disabled",
                            },
                            "&.Mui-disabled .MuiRadio-root": {
                              cursor: "not-allowed",
                            },
                          }}
                        />
                      );
                    })}
                  </RadioGroup>
                  {errors.type ? (
                    <FormHelperText>{errors.type.message}</FormHelperText>
                  ) : null}
                </FormControl>
              )}
            />
          </ContentItem>
          <ContentItem>
            <TextField
              label={t("label.name")}
              error={!!errors.name}
              required
              autoFocus
              helperText={errors.name ? errors.name.message : null}
              {...nameRegister}
            />
          </ContentItem>
          <ContentItem>
            <TextField
              label={t("label.description")}
              multiline
              minRows={3}
              {...register("description")}
            />
          </ContentItem>
          {typeValue === WorkflowType.scheduled && (
            <ContentItem>
              <TextField
                label={t("label.schedule", { defaultValue: "Schedule" })}
                placeholder="*/5 * * * * *"
                error={!!errors.schedule}
                helperText={
                  errors.schedule
                    ? errors.schedule.message
                    : t("message.cron_format", {
                        defaultValue: "Format: */5 * * * * *",
                      })
                }
                {...scheduleRegister}
              />
            </ContentItem>
          )}
          <ContentItem>
            <Controller
              name="memoryDefinitions"
              control={control}
              render={({ field }) => {
                const { onChange, ...rest } = field;

                return (
                  <AutoCompleteEntitySelect<IMemoryDefinition>
                    fullWidth
                    searchFields={["name", "slug"]}
                    entity={EntityType.MEMORY_DEFINITION}
                    format={Format.BASIC}
                    labelKey="name"
                    label={t("label.memory_definitions", {
                      defaultValue: "Memory definitions",
                    })}
                    multiple={true}
                    onChange={(_event, selected) =>
                      onChange(selected.map(({ id }) => id))
                    }
                    {...rest}
                  />
                );
              }}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
