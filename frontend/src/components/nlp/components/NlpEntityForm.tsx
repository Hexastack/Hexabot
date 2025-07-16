/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  INlpEntity,
  INlpEntityAttributes,
  LookupStrategy,
} from "@/types/nlp-entity.types";

export const NlpEntityVarForm: FC<ComponentFormProps<INlpEntity>> = ({
  data: { defaultValues: nlpEntity },
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
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createNlpEntity } = useCreate(EntityType.NLP_ENTITY, options);
  const { mutate: updateNlpEntity } = useUpdate(EntityType.NLP_ENTITY, options);
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<INlpEntityAttributes>({
    defaultValues: {
      name: nlpEntity?.name || "",
      doc: nlpEntity?.doc || "",
      lookups: nlpEntity?.lookups || ["keywords"],
      weight: nlpEntity?.weight || 1,
    },
  });
  const validationRules = {
    name: {
      required: t("message.name_is_required"),
    },
    lookups: {},
    isChecked: {},
  };
  const onSubmitForm = (params: INlpEntityAttributes) => {
    if (nlpEntity) {
      updateNlpEntity({ id: nlpEntity.id, params });
    } else {
      createNlpEntity(params);
    }
  };

  useEffect(() => {
    if (nlpEntity) {
      reset({
        name: nlpEntity.name,
        doc: nlpEntity.doc,
        weight: nlpEntity.weight,
      });
    } else {
      reset();
    }
  }, [nlpEntity, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <FormControl>
              <FormLabel>{t("label.lookup_strategies")}</FormLabel>
              <RadioGroup
                row
                {...register("lookups")}
                defaultValue={nlpEntity ? nlpEntity.lookups[0] : "keywords"}
              >
                {Object.values(LookupStrategy).map((nlpLookup, index) => (
                  <FormControlLabel
                    key={index}
                    value={nlpLookup}
                    control={
                      <Radio
                        disabled={!!nlpEntity}
                        {...register("lookups.0")}
                      />
                    }
                    label={nlpLookup}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.name")}
              error={!!errors.name}
              {...register("name", validationRules.name)}
              required
              autoFocus
              helperText={errors.name ? errors.name.message : null}
              disabled={nlpEntity?.builtin}
            />
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.doc")}
              {...register("doc")}
              multiline={true}
              rows={3}
              disabled={nlpEntity?.builtin}
            />
          </ContentItem>
          <ContentItem maxWidth="25%">
            <Input
              label={t("label.weight")}
              {...register("weight", {
                valueAsNumber: true,
                required: t("message.weight_required_error"),
                min: {
                  value: 0.01,
                  message: t("message.weight_positive_number_error"),
                },
                validate: (value) =>
                  value && value > 0
                    ? true
                    : t("message.weight_positive_number_error"),
              })}
              type="number"
              inputProps={{
                min: 0,
                step: 0.01,
                inputMode: "numeric",
              }}
              error={!!errors.weight}
              helperText={errors.weight?.message}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
