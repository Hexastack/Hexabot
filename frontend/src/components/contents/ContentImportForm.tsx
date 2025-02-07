/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, Fragment, useState } from "react";
import { useQuery } from "react-query";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { ContentContainer, ContentItem } from "@/app-components/dialogs/";
import { useApiClient } from "@/hooks/useApiClient";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { IContentType } from "@/types/content-type.types";

export type ContentImportFormData = { row: null; contentType: IContentType };
export const ContentImportForm: FC<
  ComponentFormProps<ContentImportFormData>
> = ({ data, Wrapper = Fragment, WrapperProps, ...rest }) => {
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const { t } = useTranslate();
  const { toast } = useToast();
  const { apiClient } = useApiClient();
  const { refetch, isFetching } = useQuery(
    ["importContent", data?.contentType.id, attachmentId],
    async () => {
      if (data?.contentType.id && attachmentId) {
        await apiClient.importContent(data.contentType.id, attachmentId);
      }
    },
    {
      enabled: false,
      onError: () => {
        rest.onError?.();
        toast.error(t("message.internal_server_error"));
      },
      onSuccess: () => {
        rest.onSuccess?.();
        toast.success(t("message.success_save"));
      },
    },
  );
  const handleImportClick = () => {
    if (attachmentId && data?.contentType.id) {
      refetch();
    }
  };

  return (
    <Wrapper
      open={!!WrapperProps?.open}
      onSubmit={handleImportClick}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled: !attachmentId || isFetching,
      }}
    >
      <form onSubmit={handleImportClick}>
        <ContentContainer>
          <ContentItem>
            <AttachmentInput
              format="basic"
              accept="text/csv"
              onChange={(id, _) => {
                setAttachmentId(id);
              }}
              label=""
              value={attachmentId}
              resourceRef={AttachmentResourceRef.ContentAttachment}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
