/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { ILabel } from "./label.types";
import { IUser } from "./user.types";

interface Channel {
  name: string;
  isSocket?: boolean;
}

export interface ISubscriberAttributes {
  first_name: string;
  last_name: string;
  locale: string;
  gender: string;
  labels: string[];
  assignedTo?: string | null;
  assignedAt?: Date | null;
  lastvisit?: Date;
  retainedFrom?: Date;
  channel: Channel;
  timezone?: number;
  language: string;
  country?: string;
  foreign_id?: string;
}

export interface ISubscriberStub
  extends IBaseSchema,
    OmitPopulate<ISubscriberAttributes, EntityType.SUBSCRIBER> {}

export interface ISubscriber extends ISubscriberStub, IFormat<Format.BASIC> {
  labels: string[];
  assignedTo: string | null;
}

export interface ISubscriberFull extends ISubscriberStub, IFormat<Format.FULL> {
  labels: ILabel[];
  assignedTo?: IUser;
}
