/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
} from "@mui/material";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";


import DialogButtons from "@/app-components/buttons/DialogButtons";
import {
  DialogTitle,
  ContentContainer,
  ContentItem,
} from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useGet } from "@/hooks/crud/useGet";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ContentFieldType, IContentType } from "@/types/content-type.types";

import { FieldInput } from "./components/FieldInput";
import { FIELDS_FORM_DEFAULT_VALUES, READ_ONLY_FIELDS } from "./constants";

export type EditContentTypeDialogFieldsProps = DialogControlProps<IContentType>;

export const EditContentTypeFieldsDialog = ({
  data: contentType,
  closeDialog,
  open,
}: EditContentTypeDialogFieldsProps) => {
  const { t } = useTranslate();
  const { isLoading, data, refetch } = useGet(contentType?.id || "", {
    entity: EntityType.CONTENT_TYPE,
  });
  const { toast } = useToast();
  const {
    handleSubmit,
    control,
    reset,
    setValue,
    register,
    formState: { errors },
  } = useForm<Partial<IContentType>>({
    mode: "onChange",
    values: {
      fields: data?.fields,
      name: data?.name,
    },
    defaultValues: {
      fields: FIELDS_FORM_DEFAULT_VALUES,
      name: data?.name,
    },
  });
  const { append, fields, replace, remove } = useFieldArray<
    Pick<IContentType, "fields">,
    "fields"
  >({
    name: "fields",
    control,
    keyName: "id",
    rules: {
      required: true,
    },
  });
  const validationRules = {
    name: {
      required: t("message.name_is_required"),
    },
  };

  useEffect(() => {
    register("fields");
  }, [register]);

  useEffect(() => {
    if (data?.fields) {
      replace(data.fields);
    }
  }, [data, replace]);

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (open) {
      refetch();
    }
  }, [open, reset]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        fields: data.fields,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  function handleClose() {
    closeDialog();
  }

  const { mutateAsync: updateContentType } = useUpdate(
    EntityType.CONTENT_TYPE,
    {
      onError: (error) => {
        toast.error(`${t("message.internal_server_error")}: ${error}`);
      },
      onSuccess: () => {
        toast.success(t("message.success_save"));
      },
    },
  );

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xl"
      sx={{ width: "fit-content", mx: "auto", minWidth: "600px" }}
      onClose={handleClose}
    >
      <DialogTitle onClose={handleClose}>
        {t("title.manage_fields")}
      </DialogTitle>
      <form
        onSubmit={handleSubmit((data) => {
          if (!!contentType)
            updateContentType({
              id: contentType.id,
              params: {
                fields: data.fields,
                name: data.name,
              },
            });
          handleClose();
        })}
      >
        <DialogContent>
          <ContentContainer>
            <ContentItem>
              <Input
                label={t("label.name")}
                error={!!errors.name}
                {...register("name", validationRules.name)}
                helperText={errors.name ? errors.name.message : null}
                required
                autoFocus
              />
            </ContentItem>
            {!isLoading
              ? fields.map((f, index) => (
                  <ContentItem
                    key={f.id}
                    justifyContent="space-between"
                    alignItems="center"
                    gap={2}
                    display="flex"
                  >
                    <FieldInput
                      setValue={setValue}
                      control={control}
                      remove={remove}
                      index={index}
                      disabled={READ_ONLY_FIELDS.includes(f.label as any)}
                    />
                  </ContentItem>
                ))
              : null}
            {isLoading ? (
              <ContentItem>
                <Stack sx={{ alignItems: "center", placeContent: "center" }}>
                  <CircularProgress sx={{ color: "primary.main" }} />
                </Stack>
              </ContentItem>
            ) : null}
            <ContentItem>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() =>
                  append({
                    label: "",
                    name: "",
                    type: ContentFieldType.TEXT,
                  })
                }
                disabled={isLoading}
                sx={{ mx: "auto" }}
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
