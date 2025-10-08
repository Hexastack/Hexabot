/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export interface IInvitationAttributes {
  email: string;
  roles: string[];
}

export interface IInvitationStub extends IBaseSchema, IInvitationAttributes {
  token: string;
}

export interface IInvitation extends IInvitationStub, IFormat<Format.BASIC> {}
