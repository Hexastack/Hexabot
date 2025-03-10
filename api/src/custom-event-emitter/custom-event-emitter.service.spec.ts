import { Test, TestingModule } from '@nestjs/testing';
import { CustomEventEmitterService } from './custom-event-emitter.service';

describe('CustomEventEmitterService', () => {
  let service: CustomEventEmitterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomEventEmitterService],
    }).compile();

    service = module.get<CustomEventEmitterService>(CustomEventEmitterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
