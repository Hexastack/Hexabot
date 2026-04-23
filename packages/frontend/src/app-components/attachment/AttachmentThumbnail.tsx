/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Attachment } from "@hexabot-ai/types";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Paper,
  Typography,
} from "@mui/material";
import {
  X as ClearIcon,
  File as FileOpenIcon,
  Music as MusicNoteIcon,
  Video as VideoCameraBackOutlinedIcon,
} from "lucide-react";
import { FC } from "react";

import { useGet } from "@/hooks/crud/useGet";
import useFormattedFileSize from "@/hooks/useFormattedFileSize";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";

const AttachmentPreview = ({
  attachment,
  size = 128,
}: {
  attachment: Attachment;
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
        <MusicNoteIcon size={size} />
      ) : attachment?.type.startsWith("video") ? (
        <VideoCameraBackOutlinedIcon size={size} />
      ) : !attachment?.type.startsWith("image") ? (
        <FileOpenIcon size={size} />
      ) : null}
    </CardMedia>
  );
};

type AttachmentThumbnailProps = {
  id: string;
  size?: number;
  format: "small" | "basic" | "full";
  onChange?: (attachment: Attachment | null) => void;
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
  const AttachmentDeleteButton = (
    <Button
      color="inherit"
      variant="contained"
      startIcon={<ClearIcon size={18} />}
      onClick={(e) => {
        onChange?.(null);
        e.preventDefault();
        e.stopPropagation();
      }}
      size="small"
    >
      {t("button.delete")}
    </Button>
  );

  if (!attachment) {
    return (
      <Paper variant="spaced" sx={{ textAlign: "center" }}>
        <Typography variant="h6">
          {t("message.attachment_not_found")}
        </Typography>
        <Typography variant="body1">{`id: ${id}`}</Typography>
        {AttachmentDeleteButton}
      </Paper>
    );
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
              {AttachmentDeleteButton}
            </CardActions>
          ) : null}
        </>
      ) : null}
    </Card>
  );
};

AttachmentThumbnail.displayName = "AttachmentThumbnail";

export default AttachmentThumbnail;
