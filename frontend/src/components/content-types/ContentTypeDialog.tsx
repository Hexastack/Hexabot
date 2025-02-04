/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { FC, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ContentFieldType, IContentType } from "@/types/content-type.types";

import { FieldInput } from "./components/FieldInput";
import { FIELDS_FORM_DEFAULT_VALUES, READ_ONLY_FIELDS } from "./constants";

export type ContentTypeDialogProps = DialogControlProps<IContentType>;
export const ContentTypeDialog: FC<ContentTypeDialogProps> = ({
  open,
  data,
  closeDialog,
}) => {
  const { toast } = useToast();
  const { t } = useTranslate();
  const {
    handleSubmit,
    register,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Partial<IContentType>>({
    defaultValues: {
      name: data?.name || "",
      fields: data?.fields || FIELDS_FORM_DEFAULT_VALUES,
    },
  });
  const { append, fields, remove } = useFieldArray({
    name: "fields",
    control,
  });
  const CloseAndReset = () => {
    closeDialog();
    reset();
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  const { mutate: createContentType } = useCreate(EntityType.CONTENT_TYPE, {
    onError: (error) => {
      toast.error(error);
    },
    onSuccess: () => {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { mutateAsync: updateContentType } = useUpdate(
    EntityType.CONTENT_TYPE,
    {
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        closeDialog();
        toast.success(t("message.success_save"));
      },
    },
  );
  const onSubmitForm = async (params) => {
    if (data) {
      updateContentType({ id: data.id, params });
    } else {
      createContentType({ ...params, name: params.name || "" });
    }
  };

  return (
    <Dialog open={open} fullWidth onClose={CloseAndReset}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={CloseAndReset}>
          {data ? t("title.edit_content_type") : t("title.new_content_type")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("label.name")}
                error={!!errors.name}
                {...register("name", {
                  required: t("message.name_is_required"),
                })}
                helperText={errors.name ? errors.name.message : null}
                required
                autoFocus
              />
            </ContentItem>

            {fields.map((f, index) => (
              <ContentItem
                key={f.id}
                display="flex"
                justifyContent="space-between"
                gap={2}
              >
                <FieldInput
                  setValue={setValue}
                  control={control}
                  remove={remove}
                  index={index}
                  disabled={READ_ONLY_FIELDS.includes(f.label as any)}
                />
              </ContentItem>
            ))}
            <ContentItem>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() =>
                  append({ label: "", name: "", type: ContentFieldType.TEXT })
                }
              >
                {t("button.add")}
              </Button>
            </ContentItem>
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
