/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const MIME_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"],
  videos: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime", // common in apple devices
    "video/x-msvideo", // AVI
    "video/x-matroska", // MKV
  ],
  audios: [
    "audio/mpeg", // MP3
    "audio/mp3", // Explicit MP3 type
    "audio/ogg",
    "audio/wav",
    "audio/aac", // common in apple devices
    "audio/x-wav",
  ],
  documents: [
    "application/pdf",
    "application/msword", // older ms Word format
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // newer ms word format
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", // older excel format
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // newer excel format
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/rtf",
    "application/epub+zip",
    "application/x-7z-compressed",
    "application/zip",
    "application/x-rar-compressed",
    "application/json",
    "text/csv",
  ],
};
