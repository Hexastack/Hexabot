/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ContentOrmEntity } from './content.entity';

describe('ContentOrmEntity', () => {
  describe('buildSearchText', () => {
    it('builds key-based text from string properties only', async () => {
      const entity = new ContentOrmEntity();
      entity.title = 'Product A';
      entity.properties = {
        summary: 'Great product',
        image: {
          payload: {
            url: 'https://example.com/a.jpg',
          },
        },
        rating: 5,
        tags: ['a', 'b'],
      };
      const text = await entity.buildSearchText();

      expect(text).toBe(
        ['title: Product A', 'summary: Great product'].join('\n'),
      );
    });
  });

  describe('applySearchTextTransformation', () => {
    it('persists generated searchText during lifecycle transformation', async () => {
      const entity = new ContentOrmEntity();
      entity.title = 'Product B';
      entity.properties = {
        summary: 'Structured text',
      };

      await entity.applySearchTextTransformation();

      expect(entity.searchText).toBe(
        ['title: Product B', 'summary: Structured text'].join('\n'),
      );
    });
  });
});
