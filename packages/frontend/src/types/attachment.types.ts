/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
  type Attachment as SharedAttachment,
  type AttachmentFull as SharedAttachmentFull,
  type AttachmentStub as SharedAttachmentStub,
} from "@hexabot-ai/types";

import { Subscriber } from "./subscriber.types";
import { User } from "./user.types";

export { AttachmentAccess, AttachmentCreatedByRef, AttachmentResourceRef };

export type IAttachmentStub = SharedAttachmentStub;

export type Attachment = SharedAttachment;

export type AttachmentFull = SharedAttachmentFull;

export type ISubscriberAttachmentFull = Omit<
  SharedAttachmentFull,
  "createdBy"
> & {
  createdBy: (Subscriber | User)[];
};

export interface IAttachmentFilters extends Omit<Attachment, "resourceRef"> {
  resourceRef: AttachmentResourceRef[];
}
