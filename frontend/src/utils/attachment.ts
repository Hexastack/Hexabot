/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */


import { IAttachment } from "@/types/attachment.types";
import { FileType, TAttachmentForeignKey } from "@/types/message.types";

import { buildURL } from "./URL";

export const MIME_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  videos: ["video/mp4", "video/webm", "video/ogg"],
  audios: ["audio/mpeg", "audio/ogg", "audio/wav"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
};

export function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) {
    return FileType.image;
  } else if (mimeType.startsWith("video/")) {
    return FileType.video;
  } else if (mimeType.startsWith("audio/")) {
    return FileType.audio;
  } else {
    return FileType.file;
  }
}

export function getAttachmentDownloadUrl(
  baseUrl: string,
  attachment: TAttachmentForeignKey | IAttachment,
) {
  return "id" in attachment && attachment.id
    ? buildURL(baseUrl, `/attachment/download/${attachment.id}`)
    : attachment.url;
}

export function extractFilenameFromUrl(url: string) {
  try {
    // Parse the URL to ensure it is valid
    const parsedUrl = new URL(url);
    // Extract the pathname (part after the domain)
    const pathname = parsedUrl.pathname;
    // Extract the last segment of the pathname
    const filename = pathname.substring(pathname.lastIndexOf("/") + 1);

    // Check if a valid filename exists
    if (filename && filename.includes(".")) {
      return filename;
    }

    // If no valid filename, return the full URL
    return url;
  } catch (error) {
    // If the URL is invalid, return the input as-is
    return url;
  }
}