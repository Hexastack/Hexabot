/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "./fragments";
import { StatsType, statsTypeSchema } from "./primitives";

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

export const coerceStatsStub = (value: unknown): StatsStub => {
  return statsStubSchema.parse(value);
};

export const coerceStats = (value: unknown): Stats => {
  return statsSchema.parse(value);
};

export const coerceStatsFull = (value: unknown): StatsFull => {
  return statsFullSchema.parse(value);
};

export const coerceStatsOptional = (value: unknown): Stats | undefined => {
  return value == null ? undefined : coerceStats(value);
};

export const coerceStatsNullable = (value: unknown): Stats | null => {
  return value == null ? null : coerceStats(value);
};

export { StatsType };
