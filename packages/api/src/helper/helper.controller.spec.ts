/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';

import { HelperController } from './helper.controller';
import { HelperService } from './helper.service';
import { HelperType } from './types';

describe('HelperController', () => {
  let controller: HelperController;
  let helperService: jest.Mocked<Pick<HelperService, 'getAllByType'>>;

  beforeEach(() => {
    helperService = {
      getAllByType: jest.fn(),
    };

    controller = new HelperController(
      helperService as unknown as HelperService,
    );
  });

  it('returns helpers for a known helper type', () => {
    helperService.getAllByType.mockReturnValue([
      {
        getName: () => 'local-storage',
      } as any,
    ]);

    const result = controller.getHelpers('storage');

    expect(helperService.getAllByType).toHaveBeenCalledWith(HelperType.STORAGE);
    expect(result).toEqual([{ name: 'local-storage' }]);
  });

  it.each(['unknown', 'nlu', 'llm'])(
    'throws for unsupported helper type "%s"',
    (type) => {
      expect(() => controller.getHelpers(type)).toThrow(BadRequestException);
      expect(helperService.getAllByType).not.toHaveBeenCalled();
    },
  );
});
