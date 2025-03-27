import { Test, TestingModule } from '@nestjs/testing';
import { SaquesService } from './saques.service';

describe('SaquesService', () => {
  let service: SaquesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaquesService],
    }).compile();

    service = module.get<SaquesService>(SaquesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
