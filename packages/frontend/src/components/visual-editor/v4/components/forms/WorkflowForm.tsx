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
import Grid from "@mui/material/Grid";
import type { JSONSchema7 as JsonSchema } from "json-schema";
import { FC, Fragment, useEffect, useMemo, useRef } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import {
  JsonSchemaObjectBuilder,
  SchemaNodeForm,
  fromJsonSchema,
  toJsonSchema,
} from "@/app-components/inputs/JsonSchemaObjectBuilder";
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

type TranslateFn = ReturnType<typeof useTranslate>["t"];

const getConversationalWorkflowInputSchema = (t: TranslateFn): JsonSchema => ({
  type: "object",
  properties: {
    event_type: {
      type: "string",
      title: t("label.event_type"),
      description: t("message.workflow_input_event_type_description"),
    },
    message_type: {
      type: "string",
      title: t("label.message_type"),
      description: t("message.workflow_input_message_type_description"),
    },
    payload: {
      title: t("label.payload"),
      description: t("message.workflow_input_payload_description"),
    },
    message: {
      type: "object",
      additionalProperties: true,
      title: t("label.message"),
      description: t("message.workflow_input_message_description"),
    },
    text: {
      type: "string",
      title: t("label.text"),
      description: t("message.workflow_input_text_description"),
    },
    mid: {
      type: "string",
      title: t("label.mid"),
      description: t("message.workflow_input_mid_description"),
    },
  },
  required: ["event_type", "message", "text"],
  additionalProperties: false,
});
const getScheduledWorkflowInputSchema = (t: TranslateFn): JsonSchema => ({
  type: "object",
  properties: {
    schedule: {
      type: ["string", "null"],
      title: t("label.schedule"),
      description: t("message.workflow_input_schedule_description"),
    },
    triggered_at: {
      type: ["string", "null"],
      format: "date-time",
      title: t("label.triggered_at"),
      description: t("message.workflow_input_triggered_at_description"),
    },
  },
  required: ["schedule", "triggered_at"],
  additionalProperties: false,
});
const MANUAL_WORKFLOW_DEFAULT_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {},
  additionalProperties: true,
};
const getDefaultInputSchemaByWorkflowType = (
  type: WorkflowType,
  t: TranslateFn,
): JsonSchema => {
  switch (type) {
    case WorkflowType.manual:
      return MANUAL_WORKFLOW_DEFAULT_INPUT_SCHEMA;
    case WorkflowType.scheduled:
      return getScheduledWorkflowInputSchema(t);
    case WorkflowType.conversational:
    default:
      return getConversationalWorkflowInputSchema(t);
  }
};
const buildInputSchemaNode = (
  type: WorkflowType,
  t: TranslateFn,
  inputSchema?: JsonSchema,
): SchemaNodeForm => {
  const defaultSchema = getDefaultInputSchemaByWorkflowType(type, t);
  const schemaNode = fromJsonSchema(inputSchema ?? defaultSchema, "object");

  if (schemaNode.type === "object") {
    return schemaNode;
  }

  return fromJsonSchema(defaultSchema, "object");
};
const cloneSchemaNode = (schema: SchemaNodeForm): SchemaNodeForm =>
  JSON.parse(JSON.stringify(schema)) as SchemaNodeForm;
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
  inputSchema: SchemaNodeForm;
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
  const translateRef = useRef(t);

  translateRef.current = t;

  const { toast } = useToast();
  const { definition, definitionYaml, onCreated, onUpdated } =
    presetValues ?? {};
  const isEditing = Boolean(workflow?.id);
  const defaultValues = useMemo(() => {
    const workflowType = workflow?.type ?? WorkflowType.conversational;

    return workflow
      ? {
          name: workflow.name ?? "",
          description: workflow.description ?? "",
          type: workflowType,
          schedule: workflow.schedule ?? "",
          memoryDefinitions: workflow.memoryDefinitions ?? [],
          inputSchema: buildInputSchemaNode(
            workflowType,
            translateRef.current,
            workflow.inputSchema,
          ),
        }
      : {
          name: "",
          description: "",
          type: workflowType,
          schedule: "",
          memoryDefinitions: [],
          inputSchema: buildInputSchemaNode(workflowType, translateRef.current),
        };
  }, [workflow]);
  const form = useForm<WorkflowFormValues>({
    defaultValues,
  });
  const {
    control,
    register,
    reset,
    clearErrors,
    getValues,
    setValue,
    formState: { errors, dirtyFields },
    handleSubmit,
  } = form;
  const typeValue = (useWatch({ control, name: "type" }) ??
    defaultValues.type) as WorkflowType;
  const inputSchemaValue = useWatch({
    control,
    name: "inputSchema",
  }) as SchemaNodeForm | undefined;
  const isManualWorkflow = typeValue === WorkflowType.manual;
  const previousTypeRef = useRef<WorkflowType>(defaultValues.type);
  const manualInputSchemaDraftRef = useRef<SchemaNodeForm>(
    buildInputSchemaNode(WorkflowType.manual, translateRef.current),
  );
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
  const { mutate: createWorkflow, isPending: isCreating } = useCreate<
    EntityType.WORKFLOW,
    IWorkflowSubmitAttributes
  >(EntityType.WORKFLOW, {
    ...options,
    onSuccess: (created) => {
      onCreated?.(created);
      options.onSuccess();
    },
  });
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
    const shouldIncludeManualInputSchema =
      params.type === WorkflowType.manual &&
      (!workflow?.id || Boolean(dirtyFields.inputSchema));
    const payload: IWorkflowSubmitAttributes = {
      name,
      description,
      type: params.type,
      schedule,
      memoryDefinitions,
    };

    if (shouldIncludeManualInputSchema) {
      payload.inputSchema = toJsonSchema(params.inputSchema) as JsonSchema;
    }

    if (workflow?.id) {
      updateWorkflow({
        id: workflow.id,
        params: payload,
      });

      return;
    }

    if (!definition || !definitionYaml) {
      rest.onError?.();
      toast.error(t("message.unable_to_save"));

      return;
    }

    createWorkflow({
      ...payload,
      definitionYml: definitionYaml,
    });
  };

  useEffect(() => {
    reset(defaultValues);
    previousTypeRef.current = defaultValues.type;
    manualInputSchemaDraftRef.current = cloneSchemaNode(
      defaultValues.type === WorkflowType.manual
        ? defaultValues.inputSchema
        : buildInputSchemaNode(WorkflowType.manual, translateRef.current),
    );
  }, [defaultValues, reset]);

  useEffect(() => {
    if (typeValue !== WorkflowType.scheduled) {
      clearErrors("schedule");
    }
  }, [clearErrors, typeValue]);

  useEffect(() => {
    if (typeValue !== WorkflowType.manual || !inputSchemaValue) {
      return;
    }

    manualInputSchemaDraftRef.current = cloneSchemaNode(inputSchemaValue);
  }, [inputSchemaValue, typeValue]);

  useEffect(() => {
    const previousType = previousTypeRef.current;

    if (previousType === typeValue) {
      return;
    }

    if (previousType === WorkflowType.manual) {
      manualInputSchemaDraftRef.current = cloneSchemaNode(
        getValues("inputSchema"),
      );
    }

    if (typeValue === WorkflowType.manual) {
      setValue("inputSchema", cloneSchemaNode(manualInputSchemaDraftRef.current), {
        shouldDirty: true,
        shouldTouch: false,
      });
    } else {
      setValue(
        "inputSchema",
        buildInputSchemaNode(typeValue, translateRef.current),
        {
          shouldDirty: true,
          shouldTouch: false,
        },
      );
    }

    previousTypeRef.current = typeValue;
  }, [getValues, setValue, typeValue]);

  return (
    <FormProvider {...form}>
      <Wrapper
        onSubmit={handleSubmit(onSubmitForm)}
        {...WrapperProps}
        confirmButtonProps={{
          ...WrapperProps?.confirmButtonProps,
          disabled: isCreating || isUpdating,
        }}
      >
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
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
                                        width="32px"
                                        height="32px"
                                        padding="4px"
                                      />
                                    }
                                    checkedIcon={
                                      <WorkflowTypeBadge
                                        workflow={badgeWorkflow}
                                        selected={isSelected}
                                        width="32px"
                                        height="32px"
                                        padding="4px"
                                      />
                                    }
                                  />
                                }
                                label={
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    fontWeight={500}
                                    color={
                                      isSelected ? "primary" : "textPrimary"
                                    }
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
                      const { onChange, ...restField } = field;

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
                          {...restField}
                        />
                      );
                    }}
                  />
                </ContentItem>
              </ContentContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <ContentContainer>
                {!isManualWorkflow && (
                  <ContentItem pt={0}>
                    <Typography variant="caption" color="text.secondary">
                      {t(
                        "message.input_schema_readonly_for_non_manual_workflows",
                        {
                          defaultValue:
                            "Input schema is read-only for conversational and scheduled workflows.",
                        },
                      )}
                    </Typography>
                  </ContentItem>
                )}
                <ContentItem>
                  <JsonSchemaObjectBuilder
                    name="inputSchema"
                    label={t("label.input_schema", {
                      defaultValue: "Input schema",
                    })}
                    readOnly={!isManualWorkflow}
                  />
                </ContentItem>
              </ContentContainer>
            </Grid>
          </Grid>
        </form>
      </Wrapper>
    </FormProvider>
  );
};
