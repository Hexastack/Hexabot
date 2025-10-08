/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { EntityType } from "@/services/types";
import { TAttachmentForeignKey } from "@/types/message.types";
import {
  extractFilenameFromUrl,
  getAttachmentDownloadUrl,
} from "@/utils/attachment";

import { useGet } from "./crud/useGet";
import { useConfig } from "./useConfig";

export const useGetAttachmentMetadata = (
  attachmentPayload?: TAttachmentForeignKey,
) => {
  const { apiUrl } = useConfig();
  const { data: attachment } = useGet(
    attachmentPayload?.id || "",
    {
      entity: EntityType.ATTACHMENT,
    },
    {
      enabled: !!attachmentPayload?.id,
    },
  );

  if (!attachmentPayload) {
    return null;
  }

  if (attachment) {
    return {
      name: attachmentPayload.id
        ? attachment.name
        : extractFilenameFromUrl(attachment.url),
      url: getAttachmentDownloadUrl(apiUrl, attachment),
    };
  }

  const url = getAttachmentDownloadUrl(apiUrl, attachmentPayload);

  return {
    name: extractFilenameFromUrl(url || "/#"),
    url,
  };
};
