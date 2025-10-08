/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Box, FormHelperText, FormLabel } from "@mui/material";
import { forwardRef } from "react";

import { useGet } from "@/hooks/crud/useGet";
import { useHasPermission } from "@/hooks/useHasPermission";
import { EntityType } from "@/services/types";
import { AttachmentResourceRef, IAttachment } from "@/types/attachment.types";
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
  resourceRef: AttachmentResourceRef;
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
      resourceRef,
    },
    ref,
  ) => {
    const hasPermission = useHasPermission();
    const handleChange = (attachment?: IAttachment | null) => {
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
            resourceRef={resourceRef}
          />
        ) : null}
        {helperText ? (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        ) : null}
      </Box>
    );
  },
);

AttachmentInput.displayName = "AttachmentInput";

export default AttachmentInput;
