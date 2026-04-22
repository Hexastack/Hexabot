/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Thread as SharedThread,
  ThreadFull as SharedThreadFull,
  ThreadStub as SharedThreadStub,
} from "@hexabot-ai/types";

import { Subscriber } from "./subscriber.types";

export const ThreadStatus = {
  open: "open",
  closed: "closed",
} as const;

export type ThreadStatus = (typeof ThreadStatus)[keyof typeof ThreadStatus];

export const ThreadCloseReason = {
  manual: "manual",
  inactivity: "inactivity",
} as const;

export type ThreadCloseReason =
  (typeof ThreadCloseReason)[keyof typeof ThreadCloseReason];

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

export type ThreadStub = SharedThreadStub;

export type Thread = SharedThread;

export type ThreadFull = Omit<SharedThreadFull, "subscriber"> & {
  subscriber: Subscriber;
};
