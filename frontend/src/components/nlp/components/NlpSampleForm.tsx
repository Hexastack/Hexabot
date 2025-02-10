/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, Fragment } from "react";

import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  INlpDatasetSample,
  INlpDatasetSampleAttributes,
  INlpSampleFormAttributes,
} from "@/types/nlp-sample.types";

import NlpDatasetSample from "./NlpTrainForm";

export const NlpSampleForm: FC<ComponentFormProps<INlpDatasetSample>> = ({
  data,
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: updateSample } = useUpdate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes
  >(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
    },
  });
  const onSubmitForm = (form: INlpSampleFormAttributes) => {
    if (data?.id) {
      updateSample(
        {
          id: data.id,
          params: {
            text: form.text,
            type: form.type,
            entities: [...form.keywordEntities, ...form.traitEntities],
            language: form.language,
          },
        },
        {
          onSuccess: () => {
            rest.onSuccess?.();
          },
        },
      );
    }
  };

  return (
    <Wrapper onSubmit={() => {}} {...WrapperProps}>
      <NlpDatasetSample sample={data || undefined} submitForm={onSubmitForm} />
    </Wrapper>
  );
};
