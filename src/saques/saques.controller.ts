import { Controller, Post, Body } from '@nestjs/common';
import { SaquesService } from './saques.service';
import { CreateSaqueDto } from './dto/create-saque.dto';

@Controller('saques')
export class SaquesController {
  constructor(private readonly saquesService: SaquesService) {}

  @Post()
  async solicitarSaque(@Body() dto: CreateSaqueDto) {
    return this.saquesService.solicitarSaque(dto);
  }
}
