/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ClearIcon from "@mui/icons-material/Clear";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import VideoCameraBackOutlinedIcon from "@mui/icons-material/VideoCameraBackOutlined";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import { FC } from "react";

import { useGet } from "@/hooks/crud/useGet";
import useFormattedFileSize from "@/hooks/useFormattedFileSize";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IAttachment } from "@/types/attachment.types";

const AttachmentPreview = ({
  attachment,
  size = 128,
}: {
  attachment: IAttachment;
  size: number;
}) => {
  const isImage = attachment?.type.startsWith("image");

  return (
    <CardMedia
      sx={{
        ...(isImage ? { width: size, height: size } : {}),
        flex: "1 1 50%",
        textAlign: "center",
        margin: "auto",
      }}
      image={isImage ? attachment.url : undefined}
      title={isImage ? attachment.name : undefined}
    >
      {attachment?.type.startsWith("audio") ? (
        <MusicNoteIcon sx={{ fontSize: size }} />
      ) : attachment?.type.startsWith("video") ? (
        <VideoCameraBackOutlinedIcon sx={{ fontSize: size }} />
      ) : !attachment?.type.startsWith("image") ? (
        <FileOpenIcon sx={{ fontSize: size }} />
      ) : null}
    </CardMedia>
  );
};

type AttachmentThumbnailProps = {
  id: string;
  size?: number;
  format: "small" | "basic" | "full";
  onChange?: (attachment: IAttachment | null) => void;
};

const AttachmentThumbnail: FC<AttachmentThumbnailProps> = ({
  id,
  format = "full",
  size = 64,
  onChange,
}) => {
  const formatSize = useFormattedFileSize();
  const { data: attachment } = useGet(id, {
    entity: EntityType.ATTACHMENT,
  });
  const { t } = useTranslate();

  if (!attachment) {
    return t("message.attachment_not_found") + id;
  }

  return format === "small" ? (
    <AttachmentPreview attachment={attachment} size={size} />
  ) : (
    <Card sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      <AttachmentPreview attachment={attachment} size={size} />

      {format === "basic" || format === "full" ? (
        <>
          <CardContent sx={{ marginBottom: 0, flex: "1 1 50%" }}>
            <Typography gutterBottom component="div">
              {attachment.name}
              <Typography variant="body2" color="text.secondary">
                {attachment.type} ({formatSize(attachment.size)})
              </Typography>
            </Typography>
          </CardContent>

          {format === "full" && onChange ? (
            <CardActions sx={{ justifyContent: "center", flex: "1 1 50%" }}>
              <Button
                color="inherit"
                variant="contained"
                startIcon={<ClearIcon />}
                onClick={(e) => {
                  onChange?.(null);
                  e.preventDefault();
                  e.stopPropagation();
                }}
                size="small"
              >
                {t("button.delete")}
              </Button>
            </CardActions>
          ) : null}
        </>
      ) : null}
    </Card>
  );
};

AttachmentThumbnail.displayName = "AttachmentThumbnail";

export default AttachmentThumbnail;
