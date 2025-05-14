/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FormControlLabel, Switch } from "@mui/material";
import { useRouter } from "next/router";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import MultipleInput from "@/app-components/inputs/MultipleInput";
import { RegexInput } from "@/app-components/inputs/RegexInput";
import { useCreate } from "@/hooks/crud/useCreate";
import { useGet } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  INlpEntity,
  INlpMetadata,
  LookupStrategy,
} from "@/types/nlp-entity.types";
import { INlpValue, INlpValueAttributes } from "@/types/nlp-value.types";
import { isRegex } from "@/utils/string";

const getDefaultNlpMetadata = (
  nlpEntity: INlpEntity | undefined,
): INlpMetadata => {
  if (nlpEntity?.lookups.includes(LookupStrategy.pattern)) {
    return {
      pattern: "",
      wordBoundary: true,
      removeSpaces: false,
      toLowerCase: false,
      stripDiacritics: false,
    };
  } else {
    return {};
  }
};

export const NlpValueForm: FC<ComponentFormProps<INlpValue, INlpEntity>> = ({
  data: { defaultValues: nlpValue, presetValues: nlpEntity },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { query } = useRouter();
  const { refetch: refetchEntity } = useGet(nlpEntity?.id!, {
    entity: EntityType.NLP_ENTITY,
    format: Format.FULL,
  });
  const canHaveSynonyms = nlpEntity?.lookups.includes(LookupStrategy.keywords);
  const isPattern = nlpEntity?.lookups.includes(LookupStrategy.pattern);
  const { mutate: createNlpValue } = useCreate(EntityType.NLP_VALUE, {
    onError: () => {
      rest.onError?.();
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      rest.onSuccess?.();
      refetchEntity();
      toast.success(t("message.success_save"));
    },
  });
  const { mutate: updateNlpValue } = useUpdate(EntityType.NLP_VALUE, {
    onError: () => {
      rest.onError?.();
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  });
  const {
    reset,
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<
    INlpValueAttributes & {
      expressions: string[];
    }
  >({
    defaultValues: {
      value: nlpValue?.value || "",
      doc: nlpValue?.doc || "",
      expressions: nlpValue?.expressions || [],
      metadata: nlpValue?.metadata || getDefaultNlpMetadata(nlpEntity),
    },
  });
  const onSubmitForm = async (params: INlpValueAttributes) => {
    if (nlpValue) {
      updateNlpValue({ id: nlpValue.id, params });
    } else {
      createNlpValue({ ...params, entity: String(query.id) });
    }
  };

  useEffect(() => {
    if (nlpValue) {
      reset({
        value: nlpValue.value,
        expressions: nlpValue.expressions,
        doc: nlpValue.doc,
        metadata: nlpValue.metadata,
      });
    } else {
      reset({
        value: "",
        expressions: [],
        doc: "",
        metadata: getDefaultNlpMetadata(nlpEntity),
      });
    }
  }, [nlpValue, nlpEntity, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("placeholder.nlp_value")}
              error={!!errors.value}
              required
              autoFocus
              helperText={errors.value?.message}
              {...register("value", {
                required: t("message.value_is_required"),
              })}
            />
          </ContentItem>
          {isPattern && (
            <>
              <ContentItem>
                <RegexInput
                  {...register("metadata.pattern", {
                    required: t("message.regex_is_invalid"),
                    validate: (pattern: string | undefined) => {
                      return isRegex(pattern)
                        ? true
                        : t("message.regex_is_invalid");
                    },
                  })}
                  helperText={errors.metadata?.pattern?.message}
                  error={!!errors.metadata?.pattern}
                  label={t("label.regex")}
                  placeholder={t("placeholder.pattern")}
                  flags={["i"]}
                />
              </ContentItem>
              <ContentItem>
                <Controller
                  name="metadata.wordBoundary"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label={t("label.word_boundary")}
                    />
                  )}
                />
              </ContentItem>
              <ContentItem>
                <Controller
                  name="metadata.removeSpaces"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label={t("label.remove_spaces")}
                    />
                  )}
                />
              </ContentItem>
              <ContentItem>
                <Controller
                  name="metadata.toLowerCase"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label={t("label.to_lower_case")}
                    />
                  )}
                />
              </ContentItem>
              <ContentItem>
                <Controller
                  name="metadata.stripDiacritics"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label={t("label.strip_diacritics")}
                    />
                  )}
                />
              </ContentItem>
            </>
          )}
          <ContentItem>
            <Input
              label={t("label.doc")}
              {...register("doc")}
              multiline={true}
              rows={3}
            />
          </ContentItem>

          {canHaveSynonyms ? (
            <ContentItem>
              <Controller
                name="expressions"
                control={control}
                render={({ field }) => (
                  <MultipleInput
                    label={t("label.synonyms")}
                    {...field}
                    minInput={1}
                  />
                )}
              />
            </ContentItem>
          ) : null}
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
