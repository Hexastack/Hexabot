/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Box, FormHelperText, FormLabel } from "@mui/material";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

import { useGet } from "@/hooks/crud/useGet";
import { useHasPermission } from "@/hooks/useHasPermission";
import { EntityType } from "@/services/types";
import { IAttachment } from "@/types/attachment.types";
import { PermissionAction } from "@/types/permission.types";

import AttachmentThumbnail from "./AttachmentThumbnail";
import AttachmentUploader from "./AttachmentUploader";

type AttachmentThumbnailProps = {
  label: string;
  value: string | undefined | null;
  format: "small" | "basic" | "full";
  accept: string;
  enableMediaLibrary?: boolean;
  size?: number;
  onChange?: (id: string | null, mimeType: string | null) => void;
  error?: boolean;
  helperText?: string;
};

const AttachmentInput = forwardRef<HTMLDivElement, AttachmentThumbnailProps>(
  (
    {
      label,
      value,
      format,
      accept,
      enableMediaLibrary = true,
      size,
      onChange,
      error,
      helperText,
    },
    ref,
  ) => {
    const hasPermission = useHasPermission();
    const { t } = useTranslation();
    const handleChange = (attachment: IAttachment | null) => {
      onChange && onChange(attachment?.id || null, attachment?.type || null);
    };

    // Ensure load the attachment if not fetched yet
    useGet(
      value || "",
      {
        entity: EntityType.ATTACHMENT,
      },
      {
        enabled: !!value,
      },
    );

    return (
      <Box ref={ref}>
        <FormLabel
          component="label"
          style={{ display: "inline-block", marginBottom: 1 }}
        >
          {label}
        </FormLabel>
        {value ? (
          <AttachmentThumbnail
            onChange={handleChange}
            id={value}
            format={format}
            size={size}
          />
        ) : hasPermission(EntityType.ATTACHMENT, PermissionAction.CREATE) ? (
          <AttachmentUploader
            accept={accept}
            enableMediaLibrary={enableMediaLibrary}
            onChange={handleChange}
          />
        ) : (
          t("message.no_attachment")
        )}
        {helperText ? (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        ) : null}
      </Box>
    );
  },
);

AttachmentInput.displayName = "AttachmentInput";

export default AttachmentInput;
