/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";

export enum StatsType {
  outgoing = "outgoing",
  new_users = "new_users",
  all_messages = "all_messages",
  incoming = "incoming",
  returning_users = "returning_users",
  retention = "retention",
  echo = "echo",
}

const statsTypeSchema = z.enum(StatsType);
const statsObjectSchema = baseStubSchema.extend({
  type: statsTypeSchema,
  day: z.coerce.date(),
  value: z.coerce.number(),
  name: z.string(),
});

export const statsStubSchema = statsObjectSchema;

export const statsSchema = statsObjectSchema;

export const statsFullSchema = statsObjectSchema;

export type StatsStub = z.infer<typeof statsStubSchema>;

export type Stats = z.infer<typeof statsSchema>;

export type StatsFull = z.infer<typeof statsFullSchema>;
