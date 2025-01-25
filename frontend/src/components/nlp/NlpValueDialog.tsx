/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */


import { Dialog, DialogActions, DialogContent } from "@mui/material";
import { useRouter } from "next/router";
import { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { Input } from "@/app-components/inputs/Input";
import MultipleInput from "@/app-components/inputs/MultipleInput";
import { useCreate } from "@/hooks/crud/useCreate";
import { useGet } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, Format } from "@/services/types";
import { INlpValue, INlpValueAttributes } from "@/types/nlp-value.types";

export type TNlpValueAttributesWithRequiredExpressions = INlpValueAttributes & {
  expressions: string[];
};

export type NlpValueDialogProps = DialogControlProps<INlpValue> & {
  canHaveSynonyms: boolean;
};

export const NlpValueDialog: FC<NlpValueDialogProps> = ({
  open,
  datum: nlpValue,
  closeDialog,
  canHaveSynonyms,
  callback,
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { query } = useRouter();
  const { refetch: refetchEntity } = useGet(
    nlpValue?.entity || String(query.id),
    {
      entity: EntityType.NLP_ENTITY,
      format: Format.FULL,
    },
  );
  const { mutateAsync: createNlpValue } = useCreate(EntityType.NLP_VALUE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess(datum) {
      refetchEntity();
      closeDialog();
      toast.success(t("message.success_save"));
      callback?.(datum);
    },
  });
  const { mutateAsync: updateNlpValue } = useUpdate(EntityType.NLP_VALUE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess(datum) {
      closeDialog();
      toast.success(t("message.success_save"));
      callback?.(datum);
    },
  });
  const { reset, register, handleSubmit, control } =
    useForm<TNlpValueAttributesWithRequiredExpressions>({
      defaultValues: {
        value: nlpValue?.value || "",
        expressions: nlpValue?.expressions || [],
      },
    });
  const validationRules = {
    value: {
      required: t("message.value_is_required"),
    },
    name: {},
    description: {},
  };
  const onSubmitForm = async (params: INlpValueAttributes) => {
    if (nlpValue) {
      updateNlpValue({ id: nlpValue.id, params });
    } else {
      createNlpValue({ ...params, entity: String(query.id) });
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (nlpValue) {
      reset({
        value: nlpValue.value,
        expressions: nlpValue.expressions,
      });
    } else {
      reset();
    }
  }, [nlpValue, reset]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {nlpValue
            ? t("title.edit_nlp_value")
            : t("title.new_nlp_entity_value")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("placeholder.nlp_value")}
                required
                autoFocus
                {...register("value", validationRules.value)}
              />
            </ContentItem>

            {canHaveSynonyms ? (
              <ContentItem>
                <Controller
                  name="expressions"
                  control={control}
                  render={({ field }) => (
                    <MultipleInput label="synonyms" {...field} />
                  )}
                />
              </ContentItem>
            ) : null}
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
