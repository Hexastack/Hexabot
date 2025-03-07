import { Test, TestingModule } from '@nestjs/testing';
import { ZookeeperService } from './zookeeper.service';

describe('ZookeeperService', () => {
  let service: ZookeeperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZookeeperService],
    }).compile();

    service = module.get<ZookeeperService>(ZookeeperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
