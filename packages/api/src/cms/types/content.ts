/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentType } from '../entities/content-type.entity';
import { Content } from '../entities/content.entity';

export type ContentPopulate = 'entity';

export type ContentFull = Omit<Content, 'entity'> & {
  entity: ContentType | null;
};

export const CONTENT_POPULATE: ContentPopulate[] = ['entity'];
