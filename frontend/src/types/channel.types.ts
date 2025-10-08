/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { IBaseSchema } from "./base.types";

export interface IChannelAttributes {
  name: string;
}

// @TODO: not all entities extend from IBaseSchema
export interface IChannel extends IChannelAttributes, IBaseSchema {}
