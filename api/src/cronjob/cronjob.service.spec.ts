import { Test, TestingModule } from '@nestjs/testing';
import { CronjobService } from './cronjob.service';

describe('CronjobService', () => {
  let service: CronjobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronjobService],
    }).compile();

    service = module.get<CronjobService>(CronjobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
