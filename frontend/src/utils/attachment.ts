/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { FileType } from "@/types/message.types";

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
