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

  it('maps legacy nlu type to llm', () => {
    helperService.getAllByType.mockReturnValue([
      {
        getName: () => 'llm',
      } as any,
    ]);

    const result = controller.getHelpers('nlu');

    expect(helperService.getAllByType).toHaveBeenCalledWith(HelperType.LLM);
    expect(result).toEqual([{ name: 'llm' }]);
  });

  it('throws for unknown helper type', () => {
    expect(() => controller.getHelpers('unknown')).toThrow(BadRequestException);
    expect(helperService.getAllByType).not.toHaveBeenCalled();
  });
});
