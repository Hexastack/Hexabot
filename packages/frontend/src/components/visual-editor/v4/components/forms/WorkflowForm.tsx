/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import { WorkflowType } from "@hexabot-ai/types";
import type { Workflow } from "@hexabot-ai/types";
import { TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import type { JSONSchema7 as JsonSchema } from "json-schema";
import { FC, Fragment, useEffect, useMemo, useRef } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import {
  JsonSchemaObjectBuilder,
  SchemaNodeForm,
  fromJsonSchema,
  toJsonSchema,
} from "@/app-components/inputs/JsonSchemaObjectBuilder";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IWorkflowSubmitAttributes } from "@/types/workfow.types";

import { WorkflowTypeSelector } from "./WorkflowTypeSelector";

type TranslateFn = ReturnType<typeof useTranslate>["t"];

const getConversationalWorkflowInputSchema = (t: TranslateFn): JsonSchema => ({
  type: "object",
  properties: {
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
  required: ["message", "text"],
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

type WorkflowFormPreset = {
  definition?: WorkflowDefinition;
  definitionYaml?: string;
  onCreated?: (workflow: Workflow) => void;
  onUpdated?: (workflow: Workflow) => void;
};

type WorkflowFormValues = {
  name: string;
  description: string;
  type: WorkflowType;
  schedule: string;
  inputSchema: SchemaNodeForm;
};

export const WorkflowForm: FC<
  ComponentFormProps<Workflow, WorkflowFormPreset>
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
  const { refetchUser } = useAuth();
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
    resetField,
    setValue,
    getValues,
    clearErrors,
    formState: { errors, dirtyFields },
    handleSubmit,
  } = form;
  const typeValue = (useWatch({ control, name: "type" }) ??
    defaultValues.type) as WorkflowType;
  const isManualWorkflow = typeValue === WorkflowType.manual;
  const nameRegister = register("name", {
    required: t("message.name_is_required"),
    setValueAs: (value: string) => value?.trim(),
  });
  const handleTypeChange = (nextType: WorkflowType) => {
    const currentType = getValues("type");

    if (currentType === nextType) {
      return;
    }

    setValue("type", nextType, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    resetField("inputSchema", {
      defaultValue: buildInputSchemaNode(nextType, translateRef.current),
    });
  };
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
    onError: (error: Error & { statusCode?: number }) => {
      if (error.statusCode === 403) {
        void refetchUser();
      }
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
    const shouldIncludeManualInputSchema =
      params.type === WorkflowType.manual &&
      (!workflow?.id || Boolean(dirtyFields.inputSchema));
    const payload: IWorkflowSubmitAttributes = {
      name,
      description,
      type: params.type,
      schedule,
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
  }, [defaultValues, reset]);

  useEffect(() => {
    if (typeValue !== WorkflowType.scheduled) {
      clearErrors("schedule");
    }
  }, [clearErrors, typeValue]);

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
                      <WorkflowTypeSelector
                        name={field.name}
                        value={
                          (field.value as WorkflowType) ?? defaultValues.type
                        }
                        onBlur={field.onBlur}
                        onChange={handleTypeChange}
                        disabled={isEditing}
                        error={!!errors.type}
                        helperText={errors.type?.message}
                      />
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
              </ContentContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <ContentContainer>
                <ContentItem>
                  <JsonSchemaObjectBuilder
                    key={`input-schema-${typeValue}`}
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
