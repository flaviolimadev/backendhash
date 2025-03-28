import { Controller, Get } from '@nestjs/common';
import { CronService } from './cron.service';

@Controller('cron')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Get('testar')
  async testarRendimento() {
    await this.cronService.gerarRendimentosDiarios();
    return { message: '✅ Cron de rendimento executado com sucesso' };
  }
}
