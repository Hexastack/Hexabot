/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
