/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import LinkIcon from "@mui/icons-material/Link";
import {
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { isAbsoluteUrl } from "next/dist/shared/lib/utils";
import { FC, useEffect } from "react";
import {
  Controller,
  ControllerRenderProps,
  FieldErrors,
  useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { Adornment } from "@/app-components/inputs/Adornment";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { EntityType } from "@/services/types";
import {
  ContentField,
  ContentFieldType,
  IContentType,
} from "@/types/content-type.types";
import { IContent, IContentAttributes } from "@/types/content.types";
import { MIME_TYPES } from "@/utils/attachment";

interface ContentFieldInput {
  contentField: ContentField;
  field: ControllerRenderProps<any, string>;
  errors: FieldErrors<
    IContentAttributes & {
      [key: string]: any;
    }
  >;
}

const ContentFieldInput: React.FC<ContentFieldInput> = ({
  contentField: contentField,
  field,
  errors,
}) => {
  const { t } = useTranslation();

  switch (contentField.type) {
    case ContentFieldType.TEXT:
    case ContentFieldType.TEXTAREA:
    case ContentFieldType.URL:
      return (
        <Input
          multiline={contentField.type === ContentFieldType.TEXTAREA}
          rows={contentField.type === ContentFieldType.TEXTAREA ? 5 : 1}
          label={t(`label.${contentField.name}`, {
            defaultValue: contentField.label,
          })}
          InputProps={
            contentField.type === ContentFieldType.URL
              ? {
                  startAdornment: <Adornment Icon={LinkIcon} />,
                }
              : undefined
          }
          {...field}
          error={!!errors[contentField.name]}
          helperText={
            errors[contentField.name] ? (
              <>{errors[contentField.name]?.message}</>
            ) : null
          }
        />
      );
    case ContentFieldType.CHECKBOX:
      return (
        <FormControlLabel
          label={t(`label.${contentField.name}`, {
            defaultValue: contentField.label,
          })}
          {...field}
          control={<Switch checked={field.value} />}
        />
      );
    case ContentFieldType.FILE:
      return (
        <AttachmentInput
          label={t(`label.${contentField.name}`, {
            defaultValue: contentField.label,
          })}
          {...field}
          onChange={(id, mimeType) => {
            field.onChange({ type: mimeType, payload: { attachment_id: id } });
          }}
          value={field.value?.payload?.attachment_id}
          accept={MIME_TYPES["images"].join(",")}
          format="full"
        />
      );
    default:
      return <Input {...field} error={!!errors[contentField.name]} />;
  }
};

export type ContentDialogProps = DialogControlProps<{
  content?: IContent;
  contentType?: IContentType;
}>;
export const ContentDialog: FC<ContentDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { content, contentType } = data || {
    content: undefined,
    contentType: undefined,
  };
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    reset,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<IContentAttributes & { [key: string]: any }>({
    defaultValues: {
      entity: content?.entity || "",
      status: content?.status || false,
      title: content?.title || "",
    },
  });
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    url: {
      required: t("message.url_is_invalid"),
      validate: (value: string) =>
        isAbsoluteUrl(value) || t("message.url_is_invalid"),
    },
  };
  const { mutateAsync: createContent } = useCreate(EntityType.CONTENT);
  const { mutateAsync: updateContent } = useUpdate(EntityType.CONTENT);
  const onSubmitForm = async (params: IContentAttributes) => {
    if (content) {
      updateContent(
        { id: content.id, params },
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
    } else if (contentType) {
      createContent(
        { ...params, entity: contentType.id },
        {
          onError: (error) => {
            toast.error(error);
          },
          onSuccess: () => {
            closeDialog();
            toast.success(t("message.success_save"));
          },
        },
      );
    } else {
      throw new Error("Content Type must be passed to the dialog form.");
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (content) {
      reset({
        entity: content.entity,
        status: content.status,
        title: content.title,
      });
    } else {
      reset();
    }
  }, [content, reset]);

  return (
    <Dialog open={open} fullWidth maxWidth="md" onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {content ? t("title.edit_node") : t("title.new_content")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            {(contentType?.fields || []).map((contentField) => (
              <ContentItem key={contentField.name}>
                <Controller
                  name={contentField.name}
                  control={control}
                  defaultValue={content ? content[contentField.name] : null}
                  rules={
                    contentField.name === "title"
                      ? validationRules.title
                      : contentField.type === ContentFieldType.URL
                      ? validationRules.url
                      : undefined
                  }
                  render={({ field }) => (
                    <FormControl fullWidth sx={{ paddingTop: ".75rem" }}>
                      <ContentFieldInput
                        contentField={contentField}
                        field={field}
                        errors={errors}
                      />
                    </FormControl>
                  )}
                />
              </ContentItem>
            ))}
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
