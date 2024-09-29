/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
