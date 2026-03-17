/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FormControlLabel, MenuItem, Switch, TextField } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ICredential } from "@/types/credential.types";
import {
  IMcpServer,
  IMcpServerAttributes,
  McpServerTransport,
} from "@/types/mcp-server.types";
import { isAbsoluteUrl } from "@/utils/URL";

export const McpServerForm: FC<ComponentFormProps<IMcpServer>> = ({
  data: { defaultValues: mcpServer },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createMcpServer } = useCreate(EntityType.MCP_SERVER, options);
  const { mutate: updateMcpServer } = useUpdate(EntityType.MCP_SERVER, options);
  const {
    reset,
    register,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<IMcpServerAttributes>({
    defaultValues: {
      name: mcpServer?.name || "",
      enabled: mcpServer?.enabled ?? true,
      transport: mcpServer?.transport || McpServerTransport.http,
      url: mcpServer?.url || "",
      credential: mcpServer?.credential || null,
    },
  });
  const validationRules = {
    name: {
      required: t("message.name_is_required"),
    },
    url: {
      required: t("message.url_is_required"),
      validate: (value: string) =>
        isAbsoluteUrl(value) || t("message.url_is_invalid"),
    },
    transport: {
      required: t("message.type_is_required"),
    },
  };
  const onSubmitForm = (params: IMcpServerAttributes) => {
    const payload: IMcpServerAttributes = {
      ...params,
      name: params.name.trim(),
      url: params.url.trim(),
      credential: params.credential || null,
    };

    if (mcpServer) {
      updateMcpServer({ id: mcpServer.id, params: payload });
    } else {
      createMcpServer(payload);
    }
  };

  useEffect(() => {
    if (mcpServer) {
      reset({
        name: mcpServer.name,
        enabled: mcpServer.enabled,
        transport: mcpServer.transport,
        url: mcpServer.url,
        credential: mcpServer.credential || null,
      });
    } else {
      reset({
        name: "",
        enabled: true,
        transport: McpServerTransport.http,
        url: "",
        credential: null,
      });
    }
  }, [mcpServer, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <TextField
              label={t("label.name")}
              error={!!errors.name}
              required
              autoFocus
              helperText={errors.name ? errors.name.message : null}
              {...register("name", validationRules.name)}
            />
          </ContentItem>
          <ContentItem>
            <TextField
              label={t("label.url")}
              error={!!errors.url}
              required
              helperText={errors.url ? errors.url.message : null}
              {...register("url", validationRules.url)}
            />
          </ContentItem>
          <ContentItem>
            <Controller
              name="transport"
              control={control}
              rules={validationRules.transport}
              render={({ field }) => (
                <TextField
                  select
                  required
                  label={t("label.transport")}
                  error={!!errors.transport}
                  helperText={errors.transport ? errors.transport.message : null}
                  {...field}
                >
                  {Object.values(McpServerTransport).map((transport) => (
                    <MenuItem key={transport} value={transport}>
                      {transport.toUpperCase()}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </ContentItem>
          <ContentItem>
            <Controller
              name="credential"
              control={control}
              render={({ field }) => {
                const { onChange, ...restField } = field;

                return (
                  <AutoCompleteEntitySelect<ICredential, "name", false>
                    entity={EntityType.CREDENTIAL}
                    format={Format.BASIC}
                    searchFields={["name"]}
                    labelKey="name"
                    label={t("label.credential")}
                    multiple={false}
                    onChange={(_event, selected) =>
                      onChange(selected?.id || null)
                    }
                    {...restField}
                  />
                );
              }}
            />
          </ContentItem>
          <ContentItem>
            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={t("label.enabled")}
                />
              )}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
