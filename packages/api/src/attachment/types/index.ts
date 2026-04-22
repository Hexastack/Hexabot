/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Readable, Stream } from 'stream';

export {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '@hexabot-ai/types';

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
