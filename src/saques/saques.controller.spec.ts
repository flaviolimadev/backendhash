import { Test, TestingModule } from '@nestjs/testing';
import { SaquesController } from './saques.controller';

describe('SaquesController', () => {
  let controller: SaquesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaquesController],
    }).compile();

    controller = module.get<SaquesController>(SaquesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
