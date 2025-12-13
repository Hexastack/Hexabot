/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Readable, Stream } from 'stream';

/**
 * Defines the types of createdBys for an attachment,
 * indicating whether the file belongs to a User or a Subscriber.
 */
export enum AttachmentCreatedByRef {
  User = 'User',
  Subscriber = 'Subscriber',
}

/**
 * Defines the various resource references in which an attachment can exist.
 * These resource references influence how the attachment is uploaded, stored, and accessed:
 */
export enum AttachmentResourceRef {
  SettingAttachment = 'Setting', // Attachments related to app settings, restricted to users with specific permissions.
  UserAvatar = 'User', // Avatar files for users, only the current user can upload, accessible to those with appropriate permissions.
  SubscriberAvatar = 'Subscriber', // Avatar files for subscribers, uploaded programmatically, accessible to authorized users.
  ContentAttachment = 'Content', // Files in the knowledge base, usually public but could vary based on specific needs.
  MessageAttachment = 'Message', // Files sent or received via messages, uploaded programmatically, accessible to users with inbox permissions.;
}

export enum AttachmentAccess {
  Public = 'public',
  Private = 'private',
}

export class AttachmentFile {
  /**
   * File original file name
   */
  file: Buffer | Stream | Readable | Express.Multer.File;

  /**
   * File original file name
   */
  name?: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * File MIME type
   */
  type: string;
}
