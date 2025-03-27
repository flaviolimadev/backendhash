import { Module } from '@nestjs/common';
import { SaquesController } from './saques.controller';
import { SaquesService } from './saques.service';

@Module({
  controllers: [SaquesController],
  providers: [SaquesService],
})
export class SaquesModule {}
