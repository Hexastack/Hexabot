/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FormControlLabel, FormHelperText, Switch } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IContextVar, IContextVarAttributes } from "@/types/context-var.types";
import { slugify } from "@/utils/string";

import { isRegex } from "../visual-editor/form/inputs/triggers/PatternInput";

export const ContextVarForm: FC<ComponentFormProps<IContextVar>> = ({
  data,
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createContextVar } = useCreate(
    EntityType.CONTEXT_VAR,
    options,
  );
  const { mutate: updateContextVar } = useUpdate(
    EntityType.CONTEXT_VAR,
    options,
  );
  const {
    reset,
    control,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<IContextVarAttributes>({
    defaultValues: {
      name: data?.name || "",
      label: data?.label || "",
      permanent: data?.permanent || false,
      pattern: data?.pattern || "",
    },
  });
  const validationRules = {
    name: {
      pattern: {
        value: /^[a-z_0-9]+$/,
        message: t("message.context_vars_name_is_invalid"),
      },
    },
    label: {
      required: t("message.label_is_required"),
    },
  };
  const onSubmitForm = (params: IContextVarAttributes) => {
    if (data) {
      updateContextVar({ id: data.id, params });
    } else {
      createContextVar(params);
    }
  };

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        label: data.label,
        permanent: data.permanent,
        pattern: data.pattern,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("label.label")}
              error={!!errors.label}
              required
              autoFocus
              {...register("label", validationRules.label)}
              InputProps={{
                onChange: ({ target: { value } }) => {
                  setValue("label", value);
                  setValue("name", slugify(value));
                },
              }}
              helperText={errors.label ? errors.label.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.name")}
              error={!!errors.name}
              disabled
              {...register("name", validationRules.name)}
              helperText={errors.name ? errors.name.message : null}
              InputLabelProps={{ shrink: true }}
            />
          </ContentItem>
          <ContentItem>
            <Controller
              name="permanent"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={t("label.permanent")}
                />
              )}
            />
            <FormHelperText>{t("help.permanent")}</FormHelperText>
          </ContentItem>
          <ContentItem>
            <Controller
              name="pattern"
              control={control}
              render={({ field: { value, ...rest } }) => (
                <RegexInput
                  {...rest}
                  {...register("pattern", {
                    validate: (pattern) => {
                      try {
                        if (pattern) {
                          new RegExp(pattern.slice(1, -1));

                          return true;
                        }

                        return false;
                      } catch (_e) {
                        return t("message.regex_is_invalid");
                      }
                    },
                    setValueAs: (v) => (isRegex(v) ? v : `/${v}/`),
                  })}
                  error={!!errors.pattern}
                  value={value?.slice(1, -1) || ""}
                  label={t("label.regex")}
                  onChange={rest.onChange}
                  helperText={errors.pattern ? errors.pattern.message : null}
                />
              )}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
