/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import { MenuItem } from "@mui/material";
import { FC, Fragment, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  WorkflowType,
  type IWorkflow,
  type IWorkflowAttributes,
} from "@/types/workfow.types";

const WORKFLOW_TYPES: WorkflowType[] = [
  WorkflowType.conversational,
  WorkflowType.scheduled,
  WorkflowType.manual,
];

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
};

const buildDefinitionPayload = (
  definition: WorkflowDefinition,
  updates: {
    name: string;
    version: string;
    description?: string | null;
  },
) => ({
  ...definition,
  workflow: {
    ...(definition.workflow ?? {}),
    name: updates.name,
    version: updates.version,
    description: updates.description ?? undefined,
  },
});

export const WorkflowForm: FC<ComponentFormProps<IWorkflow, WorkflowFormPreset>> =
  ({
    data: { defaultValues: workflow, presetValues },
    Wrapper = Fragment,
    WrapperProps,
    ...rest
  }) => {
    const { t } = useTranslate();
    const { toast } = useToast();
    const { definition, definitionYaml, onCreated, onUpdated } =
      presetValues ?? {};
    const defaultValues = useMemo(
      () =>
        workflow
          ? {
              name: workflow.name ?? "",
              description: workflow.description ?? "",
              type: workflow.type ?? WORKFLOW_TYPES[0],
              schedule: workflow.schedule ?? "",
            }
          : {
              name: "",
              description: "",
              type: WORKFLOW_TYPES[0],
              schedule: "",
            },
      [workflow],
    );
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
    const versionValue =
      workflow?.version ?? definition?.workflow?.version ?? "";
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
    const { mutate: updateWorkflow, isPending: isUpdating } = useUpdate(
      EntityType.WORKFLOW,
      {
        ...options,
        onSuccess: (updated) => {
          onUpdated?.(updated);
          options.onSuccess();
        },
      },
    );
    const onSubmitForm = (params: WorkflowFormValues) => {
      const name = params.name.trim();
      const description = params.description.trim() || null;
      const schedule =
        params.type === WorkflowType.scheduled
          ? params.schedule.trim() || null
          : null;

      if (workflow?.id) {
        updateWorkflow({
          id: workflow.id,
          params: {
            name,
            description,
            type: params.type,
            schedule,
          },
        });

        return;
      }

      if (!definition || !definitionYaml || !versionValue) {
        rest.onError?.();
        toast.error(t("message.unable_to_save"));

        return;
      }

      const payload: IWorkflowAttributes = {
        name,
        description,
        version: versionValue,
        type: params.type,
        schedule,
        definitionYaml,
        definition: buildDefinitionPayload(definition, {
          name,
          version: versionValue,
          description,
        }),
        memoryDefinitions: workflow?.memoryDefinitions ?? [],
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
            <ContentItem>
              <Input
                label={t("label.name")}
                error={!!errors.name}
                required
                autoFocus
                helperText={errors.name ? errors.name.message : null}
                {...nameRegister}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.description")}
                multiline
                minRows={3}
                {...register("description")}
              />
            </ContentItem>
            <ContentItem>
              <Input
                label={t("label.version", { defaultValue: "Version" })}
                value={versionValue}
                disabled
                InputProps={{ readOnly: true }}
              />
            </ContentItem>
            <ContentItem>
              <Controller
                name="type"
                control={control}
                rules={{
                  required: t("message.type_is_required", {
                    defaultValue: "Workflow type is required.",
                  }),
                }}
                render={({ field }) => (
                  <Input
                    select
                    label={t("label.type")}
                    error={!!errors.type}
                    required
                    helperText={errors.type ? errors.type.message : null}
                    inputRef={field.ref}
                    {...field}
                  >
                    {WORKFLOW_TYPES.map((type) => {
                      const typeLabel = String(type);

                      return (
                        <MenuItem key={typeLabel} value={type}>
                          {t(`label.${typeLabel}`, {
                            defaultValue:
                              typeLabel.charAt(0).toUpperCase() +
                              typeLabel.slice(1),
                          })}
                        </MenuItem>
                      );
                    })}
                  </Input>
                )}
              />
            </ContentItem>
            {typeValue === WorkflowType.scheduled && (
              <ContentItem>
                <Input
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
        </form>
      </Wrapper>
    );
  };
