/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IBaseSchema } from "./base.types";

export enum BotStatsType {
  outgoing = "outgoing",
  new_users = "new_users",
  all_messages = "all_messages",
  incoming = "incoming",
  existing_conversations = "existing_conversations",
  popular = "popular",
  new_conversations = "new_conversations",
  returning_users = "returning_users",
  retention = "retention",
}

export type StatsType =
  | "messages"
  | "conversation"
  | "audiance"
  | "popularBlocks";

export interface IBotStatAttributes {
  type: BotStatsType;
  day: string;
  value?: number;
  name: string;
  date: string;
}

export interface IBotStat extends IBotStatAttributes, Pick<IBaseSchema, "id"> {}

export type LineChartStats = {
  id: number;
  name: BotStatsType;
  values: IBotStat[];
};

export type ColumnChartStats = {
  id: number;
  name: BotStatsType;
  value: number;
};
