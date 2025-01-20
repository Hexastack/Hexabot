/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
