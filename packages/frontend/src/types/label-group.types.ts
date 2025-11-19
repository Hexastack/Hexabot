/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export interface ILabelGroupStub extends IBaseSchema {
  name: string;
}

export interface ILabelGroupAttributes {
  name: string;
}

export interface ILabelGroup extends ILabelGroupStub, IFormat<Format.BASIC> {}
