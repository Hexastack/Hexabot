/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { ISubscriber } from "./subscriber.types";

export enum ThreadStatus {
  open = "open",
  closed = "closed",
}

export enum ThreadCloseReason {
  manual = "manual",
  inactivity = "inactivity",
}

export interface IThreadAttributes {
  subscriber: string;
  status: ThreadStatus;
  lastMessageAt?: Date | null;
  closedAt?: Date | null;
  closeReason?: ThreadCloseReason | null;
  title?: string | null;
}

export interface IThreadFilters {
  subscriber: {
    id: string;
    firstName: string;
    lastName: string;
    channel: {
      name: string;
    };
    assignedTo: {
      id: string;
    };
  };
  status: ThreadStatus;
  closeReason: ThreadCloseReason;
  title: string;
}

export interface IThreadStub
  extends IBaseSchema,
    OmitPopulate<IThreadAttributes, EntityType.THREAD> {}

export interface IThread extends IThreadStub, IFormat<Format.BASIC> {
  subscriber: string;
}

export interface IThreadFull extends IThreadStub, IFormat<Format.FULL> {
  subscriber: ISubscriber;
}
