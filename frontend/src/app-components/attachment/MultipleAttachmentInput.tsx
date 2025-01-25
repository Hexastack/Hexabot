/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, Button, FormHelperText, FormLabel } from "@mui/material";
import { forwardRef, useState } from "react";

import { useHasPermission } from "@/hooks/useHasPermission";
import { EntityType } from "@/services/types";
import { AttachmentResourceRef, IAttachment } from "@/types/attachment.types";
import { PermissionAction } from "@/types/permission.types";

import AttachmentThumbnail from "./AttachmentThumbnail";
import AttachmentUploader from "./AttachmentUploader";

type MultipleAttachmentInputProps = {
  label: string;
  value: string[];
  format: "small" | "basic" | "full";
  accept: string;
  enableMediaLibrary?: boolean;
  size?: number;
  onChange?: (ids: string[]) => void;
  error?: boolean;
  helperText?: string;
  resourceRef: AttachmentResourceRef;
};

const MultipleAttachmentInput = forwardRef<
  HTMLDivElement,
  MultipleAttachmentInputProps
>(
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
    const [attachments, setAttachments] = useState<string[]>(value);
    const [uploadKey, setUploadKey] = useState(Date.now());
    const hasPermission = useHasPermission();
    const handleChange = (attachment?: IAttachment | null, index?: number) => {
      const updatedAttachments = [...attachments];

      if (attachment) {
        if (index !== undefined) {
          updatedAttachments[index] = attachment.id;
        } else {
          updatedAttachments.push(attachment.id);
        }
      } else if (index !== undefined) {
        updatedAttachments.splice(index, 1);
      }

      setAttachments(updatedAttachments);
      onChange && onChange(updatedAttachments);
      setUploadKey(Date.now());
    };
    const handleRemove = (index: number) => {
      handleChange(null, index);
    };

    return (
      <Box ref={ref}>
        <FormLabel
          component="label"
          style={{ display: "inline-block", marginBottom: 8 }}
        >
          {label}
        </FormLabel>
        {attachments.map((attachmentId, index) => (
          <Box
            key={attachmentId}
            sx={{ display: "flex", alignItems: "center", mb: 2 }}
          >
            <AttachmentThumbnail
              id={attachmentId}
              format={format}
              size={size}
              onChange={(newAttachment) => handleChange(newAttachment, index)}
            />
            <Button
              onClick={() => handleRemove(index)}
              sx={{ ml: 2 }}
              variant="outlined"
              color="secondary"
            >
              Remove
            </Button>
          </Box>
        ))}
        {hasPermission(EntityType.ATTACHMENT, PermissionAction.CREATE) && (
          <AttachmentUploader
            key={uploadKey}
            accept={accept}
            enableMediaLibrary={enableMediaLibrary}
            onChange={(attachment) => handleChange(attachment)}
            resourceRef={resourceRef}
          />
        )}
        {helperText && (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        )}
      </Box>
    );
  },
);

MultipleAttachmentInput.displayName = "MultipleAttachmentInput";

export default MultipleAttachmentInput;
