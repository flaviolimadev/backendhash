// src/deposit/deposit.controller.ts
import { Controller, Get, Param, Res } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { Response } from 'express';

@Controller('deposit')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get(':userId/:value/:cpf')
  async generatePix(
    @Param('userId') userId: string,
    @Param('value') value: string,
    @Param('cpf') cpf: string,
    @Res() res: Response,
  ) {
    const result = await this.depositService.generatePix(userId, value, cpf);
    return res.json(result);
  }
}
