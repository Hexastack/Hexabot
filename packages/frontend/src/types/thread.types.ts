/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Thread as SharedThread,
  ThreadFull as SharedThreadFull,
} from "@hexabot-ai/types";

import { Subscriber } from "./subscriber.types";

export type Thread = SharedThread;

export type ThreadFull = Omit<SharedThreadFull, "subscriber"> & {
  subscriber: Subscriber;
};
