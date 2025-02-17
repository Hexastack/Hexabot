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
  NlpLookups,
} from "@/types/nlp-entity.types";

export const NlpEntityVarForm: FC<ComponentFormProps<INlpEntity>> = ({
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
  const { mutate: createNlpEntity } = useCreate(EntityType.NLP_ENTITY, options);
  const { mutate: updateNlpEntity } = useUpdate(EntityType.NLP_ENTITY, options);
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<INlpEntityAttributes>({
    defaultValues: {
      name: data?.name || "",
      doc: data?.doc || "",
      lookups: data?.lookups || ["keywords"],
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
    if (data) {
      updateNlpEntity({ id: data.id, params });
    } else {
      createNlpEntity(params);
    }
  };

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        doc: data.doc,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          {!data ? (
            <ContentItem>
              <FormControl>
                <FormLabel>{t("label.lookup_strategies")}</FormLabel>
                <RadioGroup
                  row
                  {...register("lookups")}
                  defaultValue="keywords"
                >
                  {Object.values(NlpLookups).map((nlpLookup, index) => (
                    <FormControlLabel
                      key={index}
                      value={nlpLookup}
                      control={<Radio {...register("lookups.0")} />}
                      label={nlpLookup}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </ContentItem>
          ) : null}
          <ContentItem>
            <Input
              label={t("label.name")}
              error={!!errors.name}
              {...register("name", validationRules.name)}
              required
              autoFocus
              helperText={errors.name ? errors.name.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.doc")}
              {...register("doc")}
              multiline={true}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
