/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentOrmEntity } from '../entities/content.entity';

export type ContentPopulate = 'entity';

export type ContentEntityWithType = Omit<ContentOrmEntity, 'entity'> & {
  entity: ContentTypeOrmEntity | null;
};

export const CONTENT_POPULATE: ContentPopulate[] = ['entity'];
